package com.sgg.tenancy.dto;

import com.sgg.tenancy.entity.GymMemberStatus;

public record JoinRequestResponse(
    Long membershipId,
    GymMemberStatus status,
    String gymName
) {}
