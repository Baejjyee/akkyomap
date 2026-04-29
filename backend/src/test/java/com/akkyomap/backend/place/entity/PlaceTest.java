package com.akkyomap.backend.place.entity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import org.junit.jupiter.api.Test;

class PlaceTest {

    @Test
    void createPlaceDefaultStatusIsPending() {
        Place place = createPlace();

        assertThat(place.getStatus()).isEqualTo(PlaceStatus.PENDING);
    }

    @Test
    void approveChangesStatusToApproved() {
        Place place = createPlace();

        place.approve();

        assertThat(place.getStatus()).isEqualTo(PlaceStatus.APPROVED);
    }

    @Test
    void rejectChangesStatusToRejected() {
        Place place = createPlace();

        place.reject();

        assertThat(place.getStatus()).isEqualTo(PlaceStatus.REJECTED);
    }

    @Test
    void cannotApproveWhenStatusIsNotPending() {
        Place place = createPlace();
        place.approve();

        assertThatThrownBy(place::approve)
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void cannotRejectWhenStatusIsNotPending() {
        Place place = createPlace();
        place.reject();

        assertThatThrownBy(place::reject)
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
