package com.sgg.training.dto;

import java.time.LocalDateTime;

public record RoutineTemplateSummaryDto(
    Long id,
    String name,
    String description,
    Integer blocksCount,
    CreatorDto createdBy,
    LocalDateTime createdAt
) {
    public record CreatorDto(Long id, String fullName) {}
}
