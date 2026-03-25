package com.sgg.identity.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.identity.dto.AuthResponse;
import com.sgg.identity.dto.LoginRequest;
import com.sgg.identity.dto.RegisterRequest;
import com.sgg.identity.service.NativeAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/auth")
@RequiredArgsConstructor
public class NativeAuthController {

    private final NativeAuthService nativeAuthService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = nativeAuthService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = nativeAuthService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
