package com.akkyomap.backend.place.controller;

import com.akkyomap.backend.global.security.CustomUserDetails;
import com.akkyomap.backend.place.dto.MyPlaceResponse;
import com.akkyomap.backend.place.dto.PlaceCreateRequest;
import com.akkyomap.backend.place.dto.PlaceDetailResponse;
import com.akkyomap.backend.place.dto.PlaceMapResponse;
import com.akkyomap.backend.place.dto.PlaceResponse;
import com.akkyomap.backend.place.dto.PlaceStatusResponse;
import com.akkyomap.backend.place.dto.PlaceUpdateRequest;
import com.akkyomap.backend.place.service.PlaceService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
    public PlaceDetailResponse createPlace(
        @Valid @RequestBody PlaceCreateRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return placeService.createPlace(request, userDetails.getUserId());
    }

    @GetMapping
    public List<PlaceResponse> getApprovedPlaces() {
        return placeService.getApprovedPlaces();
    }

    @GetMapping("/{placeId}")
    public PlaceDetailResponse getApprovedPlace(@PathVariable Long placeId) {
        return placeService.getApprovedPlace(placeId);
    }

    @GetMapping("/me")
    public List<MyPlaceResponse> getMyPlaces(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return placeService.getMyPlaces(userDetails.getUserId());
    }

    @PatchMapping("/{placeId}")
    public PlaceDetailResponse updateMyPlace(
        @PathVariable Long placeId,
        @Valid @RequestBody PlaceUpdateRequest request,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return placeService.updateMyPlace(placeId, request, userDetails.getUserId());
    }

    @DeleteMapping("/{placeId}")
    public PlaceStatusResponse deleteMyPlace(
        @PathVariable Long placeId,
        @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return placeService.deleteMyPlace(placeId, userDetails.getUserId());
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
