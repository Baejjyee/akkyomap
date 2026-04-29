package com.akkyomap.backend.global.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    PLACE_NOT_FOUND(HttpStatus.NOT_FOUND, "장소를 찾을 수 없습니다."),
    PLACE_NOT_APPROVED(HttpStatus.NOT_FOUND, "승인된 장소가 아닙니다."),
    INVALID_PLACE_STATUS(HttpStatus.BAD_REQUEST, "현재 상태에서는 처리할 수 없습니다."),
    PLACE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 장소를 수정하거나 삭제할 권한이 없습니다."),
    INVALID_MAP_BOUNDS(HttpStatus.BAD_REQUEST, "지도 범위 값이 올바르지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    DUPLICATE_EMAIL(HttpStatus.BAD_REQUEST, "이미 가입된 이메일입니다."),
    INVALID_LOGIN(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }
}
