package com.sgg.tracking.dto;

import java.time.LocalDateTime;

public record HistoryStatsDto(
        long totalDistinctDays,
        long totalCompletions,
        LocalDateTime firstActivityAt,
        LocalDateTime lastActivityAt
) {}
