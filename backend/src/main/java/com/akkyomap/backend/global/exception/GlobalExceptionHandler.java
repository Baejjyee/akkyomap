package com.akkyomap.backend.global.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<FailureBody> handleBusinessException(BusinessException exception) {
        ErrorCode errorCode = exception.getErrorCode();
        return ResponseEntity
            .status(errorCode.getStatus())
            .body(FailureBody.from(errorCode.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<FailureBody> handleValidationException() {
        return ResponseEntity
            .status(ErrorCode.INVALID_REQUEST.getStatus())
            .body(FailureBody.from(ErrorCode.INVALID_REQUEST.getMessage()));
    }

    private record FailureBody(
        boolean success,
        String message,
        Object data
    ) {

        private static FailureBody from(String message) {
            return new FailureBody(false, message, null);
        }
    }
}
