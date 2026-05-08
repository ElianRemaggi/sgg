package com.sgg.tracking.dto;

import java.time.LocalDateTime;

public record AssignmentHistorySummaryDto(
        Long id,
        String templateName,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        boolean isActive,
        long totalSessionDays,
        long totalCompletions,
        LocalDateTime lastActivityAt
) {}
