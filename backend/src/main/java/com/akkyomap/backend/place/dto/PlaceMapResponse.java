package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceCategory;

public record PlaceMapResponse(
    Long id,
    String name,
    PlaceCategory category,
    Double latitude,
    Double longitude,
    String priceInfo
) {

    public static PlaceMapResponse from(Place place) {
        return new PlaceMapResponse(
            place.getId(),
            place.getName(),
            place.getCategory(),
            place.getLatitude(),
            place.getLongitude(),
            place.getPriceInfo()
        );
    }
}
