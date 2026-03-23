package com.sgg.platform.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.platform.dto.SuperAdminDto;
import com.sgg.platform.dto.UserSearchDto;
import com.sgg.platform.service.PlatformAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/platform/admins")
@RequiredArgsConstructor
public class PlatformAdminController {

    private final PlatformAdminService platformAdminService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ApiResponse<List<SuperAdminDto>> listSuperAdmins() {
        return ApiResponse.ok(platformAdminService.listSuperAdmins());
    }

    @PostMapping("/{userId}/promote")
    public ApiResponse<Void> promote(@PathVariable Long userId) {
        platformAdminService.promoteToSuperAdmin(userId);
        return ApiResponse.noContent();
    }

    @PostMapping("/{userId}/demote")
    public ApiResponse<Void> demote(@PathVariable Long userId) {
        Long currentUserId = securityUtils.getCurrentUserId();
        platformAdminService.demoteSuperAdmin(userId, currentUserId);
        return ApiResponse.noContent();
    }
}
