package com.sgg.tracking.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AssignmentHistoryDetailDto(
        Long id,
        String templateName,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        boolean isActive,
        List<HistoryBlockDto> blocks,
        HistoryStatsDto stats
) {}
