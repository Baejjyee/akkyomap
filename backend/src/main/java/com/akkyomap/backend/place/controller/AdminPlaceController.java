package com.akkyomap.backend.place.controller;

import com.akkyomap.backend.place.dto.PlaceResponse;
import com.akkyomap.backend.place.dto.PlaceStatusResponse;
import com.akkyomap.backend.place.service.PlaceService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/places")
public class AdminPlaceController {

    private final PlaceService placeService;

    // TODO: Spring Security 적용 후 ADMIN 권한 필요.
    @GetMapping("/pending")
    public List<PlaceResponse> getPendingPlaces() {
        return placeService.getPendingPlaces();
    }

    // TODO: Spring Security 적용 후 ADMIN 권한 필요.
    @PatchMapping("/{placeId}/approve")
    public PlaceStatusResponse approvePlace(@PathVariable Long placeId) {
        return placeService.approvePlace(placeId);
    }

    // TODO: Spring Security 적용 후 ADMIN 권한 필요.
    @PatchMapping("/{placeId}/reject")
    public PlaceStatusResponse rejectPlace(@PathVariable Long placeId) {
        return placeService.rejectPlace(placeId);
    }
}
