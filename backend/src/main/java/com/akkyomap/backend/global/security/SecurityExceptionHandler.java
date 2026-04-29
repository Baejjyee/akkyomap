package com.akkyomap.backend.global.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;

final class SecurityExceptionHandler {

    private SecurityExceptionHandler() {
    }

    static void writeFailure(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        new ObjectMapper().writeValue(response.getWriter(), new FailureBody(false, message, null));
    }

    private record FailureBody(
        boolean success,
        String message,
        Object data
    ) {
    }
}
