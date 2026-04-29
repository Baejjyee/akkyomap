package com.akkyomap.backend.auth.dto;

import com.akkyomap.backend.user.entity.User;
import com.akkyomap.backend.user.type.UserRole;

public record UserResponse(
    Long id,
    String email,
    String nickname,
    UserRole role
) {

    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getNickname(),
            user.getRole()
        );
    }
}
