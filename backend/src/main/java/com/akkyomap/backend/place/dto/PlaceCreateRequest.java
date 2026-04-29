package com.akkyomap.backend.place.dto;

import com.akkyomap.backend.place.entity.Place;
import com.akkyomap.backend.place.type.PlaceCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlaceCreateRequest(
    @NotBlank
    String name,

    @NotNull
    PlaceCategory category,

    @NotBlank
    String address,

    @NotNull
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    Double latitude,

    @NotNull
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    Double longitude,

    String priceInfo,

    String description
) {

    public Place toEntity() {
        return Place.create(name, category, address, latitude, longitude, priceInfo, description);
    }
}
