package com.sgg.identity.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me() {
        UserDto user = userService.getProfile(securityUtils.getCurrentUserId());
        return ResponseEntity.ok(ApiResponse.ok(user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        UserDto updated = userService.updateProfile(securityUtils.getCurrentUserId(), request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/me")
    public ResponseEntity<ApiResponse<Void>> deleteMe() {
        Long userId = securityUtils.getCurrentUserId();
        userService.deleteCurrentUser(userId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
