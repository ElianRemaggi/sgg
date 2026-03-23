package com.sgg.tenancy.dto;

import java.time.LocalDateTime;

public record MembershipDto(
    Long membershipId,
    Long gymId,
    String gymName,
    String gymSlug,
    String gymLogoUrl,
    String role,
    String status,
    LocalDateTime membershipExpiresAt
) {}
