package com.sgg.platform.dto;

import java.time.LocalDateTime;

public record GymRequestDto(
    Long id,
    String gymName,
    String contactName,
    String email,
    String phone,
    String message,
    String status,
    LocalDateTime createdAt
) {}
