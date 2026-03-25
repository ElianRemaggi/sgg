package com.sgg.identity.dto;

public record AuthResponse(
    String token,
    UserDto user
) {}
