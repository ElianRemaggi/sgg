package com.sgg.coaching.dto;

import java.time.LocalDateTime;

public record AssignedMemberDto(
    Long userId,
    String fullName,
    String avatarUrl,
    Long assignmentId,
    LocalDateTime assignedAt,
    boolean hasActiveRoutine
) {}
