package com.sgg.identity.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me(@AuthenticationPrincipal Jwt jwt) {
        UserDto user = userService.getProfile(jwt.getSubject());
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto user = userService.updateProfile(jwt.getSubject(), request);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}
