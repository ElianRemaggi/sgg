package com.sgg.platform.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.dto.PageResponse;
import com.sgg.platform.dto.GymRequestDto;
import com.sgg.platform.dto.UpdateGymRequestStatusRequest;
import com.sgg.platform.service.GymRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/platform/gym-requests")
@RequiredArgsConstructor
public class PlatformGymRequestController {

    private final GymRequestService gymRequestService;

    @GetMapping
    public ApiResponse<PageResponse<GymRequestDto>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = gymRequestService.list(status, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<GymRequestDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateGymRequestStatusRequest request) {
        return ApiResponse.ok(gymRequestService.updateStatus(id, request.status()));
    }
}
