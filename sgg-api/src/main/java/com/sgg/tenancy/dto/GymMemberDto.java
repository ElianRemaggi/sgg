package com.sgg.tenancy.dto;

import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;

import java.time.LocalDateTime;

public record GymMemberDto(
    Long memberId,
    Long userId,
    String fullName,
    String email,
    String avatarUrl,
    GymMemberRole role,
    GymMemberStatus status,
    LocalDateTime membershipExpiresAt,
    LocalDateTime joinedAt
) {}
