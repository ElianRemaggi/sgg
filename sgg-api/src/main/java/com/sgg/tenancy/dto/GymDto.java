package com.sgg.tenancy.dto;

public record GymDto(
    Long id,
    String name,
    String slug,
    String description,
    String logoUrl,
    String routineCycle
) {}
