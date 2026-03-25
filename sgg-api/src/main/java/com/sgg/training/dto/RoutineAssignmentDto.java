package com.sgg.training.dto;

import java.time.LocalDateTime;

public record RoutineAssignmentDto(
    Long id,
    String templateName,
    String memberName,
    LocalDateTime startsAt,
    LocalDateTime endsAt,
    LocalDateTime createdAt
) {}
