package com.akkyomap.backend.place.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.place.dto.PlaceCreateRequest;
import com.akkyomap.backend.place.dto.PlaceDetailResponse;
import com.akkyomap.backend.place.dto.PlaceMapResponse;
import com.akkyomap.backend.place.dto.PlaceResponse;
import com.akkyomap.backend.place.dto.PlaceStatusResponse;
import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.repository.PlaceRepository;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PlaceServiceTest {

    @Mock
    private PlaceRepository placeRepository;

    @InjectMocks
    private PlaceService placeService;

    @Test
    void createPlaceSavesPlaceWithPendingStatus() {
        PlaceCreateRequest request = new PlaceCreateRequest(
            "학생식당",
            PlaceCategory.RESTAURANT,
            "부산광역시 남구",
            35.1,
            129.0,
            "김치찌개 6000원",
            "점심이 저렴한 식당"
        );
        when(placeRepository.save(any(Place.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlaceDetailResponse response = placeService.createPlace(request);

        assertThat(response.status()).isEqualTo(PlaceStatus.PENDING);
    }

    @Test
    void getApprovedPlacesReturnsOnlyApprovedPlacesFromRepository() {
        Place approved = createPlace();
        approved.approve();
        when(placeRepository.findAllByStatus(PlaceStatus.APPROVED)).thenReturn(List.of(approved));

        List<PlaceResponse> responses = placeService.getApprovedPlaces();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).status()).isEqualTo(PlaceStatus.APPROVED);
    }

    @Test
    void pendingAndRejectedPlacesAreNotIncludedInApprovedPlaceList() {
        Place approved = createPlace();
        approved.approve();
        when(placeRepository.findAllByStatus(PlaceStatus.APPROVED)).thenReturn(List.of(approved));

        List<PlaceResponse> responses = placeService.getApprovedPlaces();

        assertThat(responses)
            .extracting(PlaceResponse::status)
            .containsOnly(PlaceStatus.APPROVED);
    }

    @Test
    void approvePlaceChangesStatusToApproved() {
        Place place = createPlace();
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        PlaceStatusResponse response = placeService.approvePlace(1L);

        assertThat(response.status()).isEqualTo(PlaceStatus.APPROVED);
    }

    @Test
    void rejectPlaceChangesStatusToRejected() {
        Place place = createPlace();
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        PlaceStatusResponse response = placeService.rejectPlace(1L);

        assertThat(response.status()).isEqualTo(PlaceStatus.REJECTED);
    }

    @Test
    void getApprovedPlacesInBoundsReturnsApprovedPlacesOnly() {
        Place approved = createPlace();
        approved.approve();
        when(placeRepository.findAllByStatusAndLatitudeBetweenAndLongitudeBetween(
            PlaceStatus.APPROVED,
            35.0,
            36.0,
            128.0,
            130.0
        )).thenReturn(List.of(approved));

        List<PlaceMapResponse> responses = placeService.getApprovedPlacesInBounds(
            35.0,
            128.0,
            36.0,
            130.0
        );

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).name()).isEqualTo("학생식당");
    }

    @Test
    void pendingAndRejectedPlacesAreNotIncludedInMapResult() {
        Place approved = createPlace();
        approved.approve();
        when(placeRepository.findAllByStatusAndLatitudeBetweenAndLongitudeBetween(
            PlaceStatus.APPROVED,
            35.0,
            36.0,
            128.0,
            130.0
        )).thenReturn(List.of(approved));

        List<PlaceMapResponse> responses = placeService.getApprovedPlacesInBounds(
            35.0,
            128.0,
            36.0,
            130.0
        );

        assertThat(responses).hasSize(1);
    }

    @Test
    void invalidMapBoundsThrowsExceptionWhenSouthWestLatitudeIsGreaterThanNorthEastLatitude() {
        assertThatThrownBy(() -> placeService.getApprovedPlacesInBounds(36.0, 128.0, 35.0, 130.0))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void invalidMapBoundsThrowsExceptionWhenSouthWestLongitudeIsGreaterThanNorthEastLongitude() {
        assertThatThrownBy(() -> placeService.getApprovedPlacesInBounds(35.0, 130.0, 36.0, 128.0))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void approveMissingPlaceThrowsException() {
        when(placeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> placeService.approvePlace(1L))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void rejectMissingPlaceThrowsException() {
        when(placeRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> placeService.rejectPlace(1L))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void getApprovedPlaceThrowsExceptionWhenPlaceIsNotApproved() {
        Place place = createPlace();
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        assertThatThrownBy(() -> placeService.getApprovedPlace(1L))
            .isInstanceOf(BusinessException.class);
    }

    private Place createPlace() {
        return Place.create(
            "학생식당",
            PlaceCategory.RESTAURANT,
            "부산광역시 남구",
            35.1,
            129.0,
            "김치찌개 6000원",
            "점심이 저렴한 식당"
        );
    }
}
