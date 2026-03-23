package com.sgg.platform.dto;

import java.time.LocalDateTime;

public record GymSummaryDto(
    Long id,
    String name,
    String slug,
    String status,
    Integer membersCount,
    String ownerName,
    String ownerEmail,
    LocalDateTime createdAt
) {}
