package com.akkyomap.backend.place.controller;

import com.akkyomap.backend.place.dto.PlaceCreateRequest;
import com.akkyomap.backend.place.dto.PlaceDetailResponse;
import com.akkyomap.backend.place.dto.PlaceMapResponse;
import com.akkyomap.backend.place.dto.PlaceResponse;
import com.akkyomap.backend.place.service.PlaceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/places")
public class PlaceController {

    private final PlaceService placeService;

    @PostMapping
    public PlaceDetailResponse createPlace(@Valid @RequestBody PlaceCreateRequest request) {
        return placeService.createPlace(request);
    }

    @GetMapping
    public List<PlaceResponse> getApprovedPlaces() {
        return placeService.getApprovedPlaces();
    }

    @GetMapping("/{placeId}")
    public PlaceDetailResponse getApprovedPlace(@PathVariable Long placeId) {
        return placeService.getApprovedPlace(placeId);
    }

    @GetMapping("/map")
    public List<PlaceMapResponse> getApprovedPlacesInBounds(
        @RequestParam Double swLat,
        @RequestParam Double swLng,
        @RequestParam Double neLat,
        @RequestParam Double neLng
    ) {
        return placeService.getApprovedPlacesInBounds(swLat, swLng, neLat, neLng);
    }
}
