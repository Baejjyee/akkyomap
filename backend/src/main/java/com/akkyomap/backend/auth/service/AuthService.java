package com.akkyomap.backend.auth.service;

import com.akkyomap.backend.auth.dto.LoginRequest;
import com.akkyomap.backend.auth.dto.SignupRequest;
import com.akkyomap.backend.auth.dto.TokenResponse;
import com.akkyomap.backend.auth.dto.UserResponse;
import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.global.exception.ErrorCode;
import com.akkyomap.backend.global.security.JwtTokenProvider;
import com.akkyomap.backend.user.entity.User;
import com.akkyomap.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.DUPLICATE_EMAIL);
        }

        User user = User.createUser(
            request.email(),
            passwordEncoder.encode(request.password()),
            request.nickname()
        );
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_LOGIN));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BusinessException(ErrorCode.INVALID_LOGIN);
        }

        String token = jwtTokenProvider.createToken(user);
        return TokenResponse.bearer(token, jwtTokenProvider.getAccessTokenExpiration());
    }

    @Transactional(readOnly = true)
    public UserResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return UserResponse.from(user);
    }
}
