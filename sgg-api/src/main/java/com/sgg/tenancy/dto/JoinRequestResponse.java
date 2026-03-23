package com.sgg.tenancy.dto;

public record JoinRequestResponse(
    Long membershipId,
    String status,
    String gymName
) {}
