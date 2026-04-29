package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceStatus;

public record PlaceStatusResponse(
    Long id,
    PlaceStatus status
) {

    public static PlaceStatusResponse from(Place place) {
        return new PlaceStatusResponse(place.getId(), place.getStatus());
    }
}
