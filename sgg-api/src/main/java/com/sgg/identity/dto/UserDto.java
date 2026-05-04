package com.sgg.identity.dto;

public record UserDto(
    Long id,
    String username,
    String fullName,
    String email,
    String avatarUrl,
    String platformRole
) {}
