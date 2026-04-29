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
import com.akkyomap.backend.place.dto.PlaceUpdateRequest;
import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.repository.PlaceRepository;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import com.akkyomap.backend.user.entity.User;
import com.akkyomap.backend.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PlaceServiceTest {

    @Mock
    private PlaceRepository placeRepository;

    @Mock
    private UserRepository userRepository;

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
        User user = createUser(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(placeRepository.save(any(Place.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PlaceDetailResponse response = placeService.createPlace(request, 1L);

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
    void updateMyApprovedPlaceChangesStatusToPending() {
        User user = createUser(1L);
        Place place = createPlace(user);
        place.approve();
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        PlaceDetailResponse response = placeService.updateMyPlace(
            1L,
            new PlaceUpdateRequest(
                "수정한 식당",
                PlaceCategory.RESTAURANT,
                "부산광역시 남구 수정로",
                35.2,
                129.1,
                "라면 4000원",
                "수정 설명"
            ),
            1L
        );

        assertThat(response.name()).isEqualTo("수정한 식당");
        assertThat(response.status()).isEqualTo(PlaceStatus.PENDING);
    }

    @Test
    void updateMyPlaceThrowsExceptionWhenCreatedByIsNull() {
        Place place = createPlace();
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        assertThatThrownBy(() -> placeService.updateMyPlace(
            1L,
            new PlaceUpdateRequest(
                "수정한 식당",
                PlaceCategory.RESTAURANT,
                "부산광역시 남구 수정로",
                35.2,
                129.1,
                "라면 4000원",
                "수정 설명"
            ),
            1L
        )).isInstanceOf(BusinessException.class);
    }

    @Test
    void deleteMyPlaceChangesStatusToDeleted() {
        User user = createUser(1L);
        Place place = createPlace(user);
        when(placeRepository.findById(1L)).thenReturn(Optional.of(place));

        PlaceStatusResponse response = placeService.deleteMyPlace(1L, 1L);

        assertThat(response.status()).isEqualTo(PlaceStatus.DELETED);
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

    private Place createPlace(User user) {
        return Place.create(
            "학생식당",
            PlaceCategory.RESTAURANT,
            "부산광역시 남구",
            35.1,
            129.0,
            "김치찌개 6000원",
            "점심이 저렴한 식당",
            user
        );
    }

    private User createUser(Long id) {
        User user = User.createUser("user@example.com", "encoded-password", "사용자");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
