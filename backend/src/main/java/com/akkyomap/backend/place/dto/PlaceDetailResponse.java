package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;
import java.time.LocalDateTime;

public record PlaceDetailResponse(
    Long id,
    String name,
    PlaceCategory category,
    String address,
    Double latitude,
    Double longitude,
    String priceInfo,
    String description,
    PlaceStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {

    public static PlaceDetailResponse from(Place place) {
        return new PlaceDetailResponse(
            place.getId(),
            place.getName(),
            place.getCategory(),
            place.getAddress(),
            place.getLatitude(),
            place.getLongitude(),
            place.getPriceInfo(),
            place.getDescription(),
            place.getStatus(),
            place.getCreatedAt(),
            place.getUpdatedAt()
        );
    }
}
