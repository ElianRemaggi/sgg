package com.sgg.identity.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.identity.dto.UpdateProfileRequest;
import com.sgg.identity.dto.UserDto;
import com.sgg.identity.entity.User;
import com.sgg.identity.mapper.UserMapper;
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
    private final UserMapper userMapper;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> me() {
        User user = securityUtils.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(userMapper.toDto(user)));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = securityUtils.getCurrentUser();
        UserDto updated = userService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
