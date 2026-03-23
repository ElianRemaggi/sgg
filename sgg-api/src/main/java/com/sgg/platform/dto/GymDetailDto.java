package com.sgg.platform.dto;

import java.time.LocalDateTime;

public record GymDetailDto(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl,
    String routineCycle,
    String status,
    UserSummaryDto owner,
    GymStatsDto stats,
    LocalDateTime createdAt
) {}
