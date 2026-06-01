package com.sgg.coaching.dto;

public record CoachSummaryDto(
    Long userId,
    String fullName,
    String email,
    Long assignedMembersCount
) {}
