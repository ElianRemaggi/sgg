package com.sgg.platform.dto;

import com.sgg.tenancy.entity.GymStatus;

import java.time.LocalDateTime;

public record GymDetailDto(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl,
    String routineCycle,
    GymStatus status,
    UserSummaryDto owner,
    GymStatsDto stats,
    LocalDateTime createdAt
) {}
