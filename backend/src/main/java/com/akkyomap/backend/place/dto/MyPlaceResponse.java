package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import java.time.LocalDateTime;

public record MyPlaceResponse(
    Long id,
    String name,
    PlaceCategory category,
    String address,
    String priceInfo,
    PlaceStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public static MyPlaceResponse from(Place place) {
        return new MyPlaceResponse(
            place.getId(),
            place.getName(),
            place.getCategory(),
            place.getAddress(),
            place.getPriceInfo(),
            place.getStatus(),
            place.getCreatedAt(),
            place.getUpdatedAt()
        );
    }
}
