package com.sgg.identity.dto;

public record UserDto(
    Long id,
    String fullName,
    String email,
    String avatarUrl,
    String platformRole
) {}
