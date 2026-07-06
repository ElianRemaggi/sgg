package com.sgg.platform.dto;

import com.sgg.tenancy.entity.GymStatus;

import java.time.LocalDateTime;

public record GymSummaryDto(
    Long id,
    String name,
    String slug,
    GymStatus status,
    Integer membersCount,
    String ownerName,
    String ownerEmail,
    LocalDateTime createdAt
) {}
