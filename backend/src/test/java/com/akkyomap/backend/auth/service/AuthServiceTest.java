package com.akkyomap.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.akkyomap.backend.auth.dto.LoginRequest;
import com.akkyomap.backend.auth.dto.SignupRequest;
import com.akkyomap.backend.auth.dto.TokenResponse;
import com.akkyomap.backend.auth.dto.UserResponse;
import com.akkyomap.backend.global.exception.BusinessException;
import com.akkyomap.backend.global.security.JwtTokenProvider;
import com.akkyomap.backend.user.entity.User;
import com.akkyomap.backend.user.repository.UserRepository;
import com.akkyomap.backend.user.type.UserRole;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @InjectMocks
    private AuthService authService;

    @Test
    void signupCreatesUserWithDefaultUserRole() {
        SignupRequest request = new SignupRequest("user@example.com", "password123", "사용자");
        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.signup(request);

        assertThat(response.email()).isEqualTo("user@example.com");
        assertThat(response.role()).isEqualTo(UserRole.USER);
    }

    @Test
    void signupThrowsExceptionWhenEmailIsDuplicated() {
        SignupRequest request = new SignupRequest("user@example.com", "password123", "사용자");
        when(userRepository.existsByEmail(request.email())).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
            .isInstanceOf(BusinessException.class);
    }

    @Test
    void loginReturnsBearerToken() {
        LoginRequest request = new LoginRequest("user@example.com", "password123");
        User user = User.createUser("user@example.com", "encoded-password", "사용자");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(true);
        when(jwtTokenProvider.createToken(user)).thenReturn("access-token");
        when(jwtTokenProvider.getAccessTokenExpiration()).thenReturn(3600000L);

        TokenResponse response = authService.login(request);

        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.expiresIn()).isEqualTo(3600000L);
    }

    @Test
    void loginThrowsExceptionWhenPasswordDoesNotMatch() {
        LoginRequest request = new LoginRequest("user@example.com", "wrong-password");
        User user = User.createUser("user@example.com", "encoded-password", "사용자");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
            .isInstanceOf(BusinessException.class);
    }
}
