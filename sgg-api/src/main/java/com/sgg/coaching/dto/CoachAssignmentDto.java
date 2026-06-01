package com.sgg.coaching.dto;

import java.time.LocalDateTime;

public record CoachAssignmentDto(
    Long id,
    Long gymId,
    Long coachUserId,
    Long memberUserId,
    LocalDateTime assignedAt
) {}
