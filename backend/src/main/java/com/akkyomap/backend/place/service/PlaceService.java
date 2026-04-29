package com.akkyomap.backend.place.service;

import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.global.exception.ErrorCode;
import com.akkyomap.backend.place.dto.PlaceCreateRequest;
import com.akkyomap.backend.place.dto.PlaceDetailResponse;
import com.akkyomap.backend.place.dto.PlaceMapResponse;
import com.akkyomap.backend.place.dto.PlaceResponse;
import com.akkyomap.backend.place.dto.PlaceStatusResponse;
import com.akkyomap.backend.place.dto.MyPlaceResponse;
import com.akkyomap.backend.place.dto.PlaceUpdateRequest;
import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.repository.PlaceRepository;
import com.akkyomap.backend.place.type.PlaceStatus;
import com.akkyomap.backend.user.entity.User;
import com.akkyomap.backend.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlaceService {

    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;

    @Transactional
    public PlaceDetailResponse createPlace(PlaceCreateRequest request, Long userId) {
        User user = findUser(userId);
        Place place = Place.create(
            request.name(),
            request.category(),
            request.address(),
            request.latitude(),
            request.longitude(),
            request.priceInfo(),
            request.description(),
            user
        );
        placeRepository.save(place);
        return PlaceDetailResponse.from(place);
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> getApprovedPlaces() {
        return placeRepository.findAllByStatus(PlaceStatus.APPROVED)
            .stream()
            .map(PlaceResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public PlaceDetailResponse getApprovedPlace(Long placeId) {
        Place place = findPlace(placeId);
        if (place.getStatus() != PlaceStatus.APPROVED) {
            throw new BusinessException(ErrorCode.PLACE_NOT_APPROVED);
        }
        return PlaceDetailResponse.from(place);
    }

    @Transactional(readOnly = true)
    public List<PlaceMapResponse> getApprovedPlacesInBounds(
        Double swLat,
        Double swLng,
        Double neLat,
        Double neLng
    ) {
        validateMapBounds(swLat, swLng, neLat, neLng);
        return placeRepository.findAllByStatusAndLatitudeBetweenAndLongitudeBetween(
                PlaceStatus.APPROVED,
                swLat,
                neLat,
                swLng,
                neLng
            )
            .stream()
            .map(PlaceMapResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PlaceResponse> getPendingPlaces() {
        return placeRepository.findAllByStatus(PlaceStatus.PENDING)
            .stream()
            .map(PlaceResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<MyPlaceResponse> getMyPlaces(Long userId) {
        findUser(userId);
        return placeRepository.findAllByCreatedByIdAndStatusNotOrderByCreatedAtDesc(userId, PlaceStatus.DELETED)
            .stream()
            .map(MyPlaceResponse::from)
            .toList();
    }

    @Transactional
    public PlaceDetailResponse updateMyPlace(Long placeId, PlaceUpdateRequest request, Long userId) {
        Place place = findPlace(placeId);
        validateOwner(place, userId);
        place.updateByOwner(
            request.name(),
            request.category(),
            request.address(),
            request.latitude(),
            request.longitude(),
            request.priceInfo(),
            request.description()
        );
        return PlaceDetailResponse.from(place);
    }

    @Transactional
    public PlaceStatusResponse deleteMyPlace(Long placeId, Long userId) {
        Place place = findPlace(placeId);
        validateOwner(place, userId);
        place.deleteByOwner();
        return PlaceStatusResponse.from(place);
    }

    @Transactional
    public PlaceStatusResponse approvePlace(Long placeId) {
        Place place = findPlace(placeId);
        place.approve();
        return PlaceStatusResponse.from(place);
    }

    @Transactional
    public PlaceStatusResponse rejectPlace(Long placeId) {
        Place place = findPlace(placeId);
        place.reject();
        return PlaceStatusResponse.from(place);
    }

    private Place findPlace(Long placeId) {
        return placeRepository.findById(placeId)
            .orElseThrow(() -> new BusinessException(ErrorCode.PLACE_NOT_FOUND));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateOwner(Place place, Long userId) {
        if (place.getCreatedBy() == null || !place.getCreatedBy().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.PLACE_ACCESS_DENIED);
        }
        if (place.getStatus() == PlaceStatus.DELETED) {
            throw new BusinessException(ErrorCode.PLACE_NOT_FOUND);
        }
    }

    private void validateMapBounds(Double swLat, Double swLng, Double neLat, Double neLng) {
        if (swLat == null || swLng == null || neLat == null || neLng == null) {
            throw new BusinessException(ErrorCode.INVALID_MAP_BOUNDS);
        }
        if (swLat < -90.0 || swLat > 90.0 || neLat < -90.0 || neLat > 90.0) {
            throw new BusinessException(ErrorCode.INVALID_MAP_BOUNDS);
        }
        if (swLng < -180.0 || swLng > 180.0 || neLng < -180.0 || neLng > 180.0) {
            throw new BusinessException(ErrorCode.INVALID_MAP_BOUNDS);
        }
        if (swLat > neLat || swLng > neLng) {
            throw new BusinessException(ErrorCode.INVALID_MAP_BOUNDS);
        }
    }
}
