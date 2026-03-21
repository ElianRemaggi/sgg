package com.sgg.common.exception;

public class TenantViolationException extends RuntimeException {

    public TenantViolationException(String message) {
        super(message);
    }
}
