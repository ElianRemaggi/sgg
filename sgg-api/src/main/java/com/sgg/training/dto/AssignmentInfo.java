package com.sgg.training.dto;

import java.time.LocalDateTime;

public record AssignmentInfo(
        Long id,
        Long templateId,
        Long memberUserId,
        Long gymId,
        LocalDateTime startsAt,
        LocalDateTime endsAt
) {}
