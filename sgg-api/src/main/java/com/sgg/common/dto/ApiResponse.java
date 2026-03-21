package com.sgg.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
    boolean success,
    T data,
    String message,
    List<String> errors
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, data, "Creado exitosamente", null);
    }

    public static ApiResponse<Void> noContent() {
        return new ApiResponse<>(true, null, null, null);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, null, message, null);
    }

    public static ApiResponse<Void> error(String message, List<String> errors) {
        return new ApiResponse<>(false, null, message, errors);
    }
}
