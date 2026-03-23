package com.sgg.tenancy.dto;

public record GymPublicDto(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl
) {}
