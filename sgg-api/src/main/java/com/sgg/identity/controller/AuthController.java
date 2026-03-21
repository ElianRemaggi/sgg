package com.sgg.identity.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.identity.dto.SyncUserRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<UserDto>> sync(@Valid @RequestBody SyncUserRequest request) {
        UserDto user = userService.syncUser(request);
        return ResponseEntity.ok(ApiResponse.ok(user));
    }
}
