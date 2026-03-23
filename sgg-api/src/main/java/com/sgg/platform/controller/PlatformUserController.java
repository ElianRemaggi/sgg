package com.sgg.platform.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.platform.dto.UserSearchDto;
import com.sgg.platform.service.PlatformAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/platform/users")
@RequiredArgsConstructor
public class PlatformUserController {

    private final PlatformAdminService platformAdminService;

    @GetMapping
    public ApiResponse<List<UserSearchDto>> searchUsers(@RequestParam(defaultValue = "") String search) {
        return ApiResponse.ok(platformAdminService.searchUsers(search));
    }
}
