package com.sgg.tenancy.dto;

import java.time.LocalDateTime;

public record GymMemberDto(
    Long memberId,
    Long userId,
    String fullName,
    String email,
    String avatarUrl,
    String role,
    String status,
    LocalDateTime membershipExpiresAt,
    LocalDateTime joinedAt
) {}
