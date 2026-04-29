package com.akkyomap.backend.auth.controller;

import com.akkyomap.backend.auth.dto.LoginRequest;
import com.akkyomap.backend.auth.dto.SignupRequest;
import com.akkyomap.backend.auth.dto.TokenResponse;
import com.akkyomap.backend.auth.dto.UserResponse;
import com.akkyomap.backend.auth.service.AuthService;
import com.akkyomap.backend.global.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public UserResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse getMe(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return authService.getMe(userDetails.getUserId());
    }
}
