package com.sgg.tenancy.dto;

import com.sgg.tenancy.entity.GymMemberRole;
import com.sgg.tenancy.entity.GymMemberStatus;
import com.sgg.tenancy.entity.GymType;

import java.time.LocalDateTime;

public record MembershipDto(
    Long membershipId,
    Long gymId,
    String gymName,
    String gymSlug,
    String gymLogoUrl,
    GymType gymType,
    GymMemberRole role,
    GymMemberStatus status,
    LocalDateTime membershipExpiresAt
) {}
