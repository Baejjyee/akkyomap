package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceCategory;
import com.akkyomap.backend.place.type.PlaceStatus;

public record PlaceResponse(
    Long id,
    String name,
    PlaceCategory category,
    String address,
    String priceInfo,
    PlaceStatus status
) {

    public static PlaceResponse from(Place place) {
        return new PlaceResponse(
            place.getId(),
            place.getName(),
            place.getCategory(),
            place.getAddress(),
            place.getPriceInfo(),
            place.getStatus()
        );
    }
}
