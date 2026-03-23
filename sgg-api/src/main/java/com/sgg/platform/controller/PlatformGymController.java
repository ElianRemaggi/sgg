package com.sgg.platform.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.dto.PageResponse;
import com.sgg.platform.dto.*;
import com.sgg.platform.service.PlatformGymService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/platform/gyms")
@RequiredArgsConstructor
public class PlatformGymController {

    private final PlatformGymService platformGymService;

    @GetMapping
    public ApiResponse<PageResponse<GymSummaryDto>> listGyms(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = platformGymService.listGyms(status, search, PageRequest.of(page, size));
        return ApiResponse.ok(PageResponse.from(result));
    }

    @GetMapping("/{gymId}")
    public ApiResponse<GymDetailDto> getGymDetail(@PathVariable Long gymId) {
        return ApiResponse.ok(platformGymService.getGymDetail(gymId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GymDetailDto>> createGym(@Valid @RequestBody CreateGymRequest request) {
        GymDetailDto created = platformGymService.createGym(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    @PutMapping("/{gymId}")
    public ApiResponse<GymDetailDto> updateGym(
            @PathVariable Long gymId,
            @Valid @RequestBody UpdateGymRequest request) {
        return ApiResponse.ok(platformGymService.updateGym(gymId, request));
    }

    @PatchMapping("/{gymId}/status")
    public ApiResponse<Void> changeGymStatus(
            @PathVariable Long gymId,
            @Valid @RequestBody ChangeGymStatusRequest request) {
        platformGymService.changeGymStatus(gymId, request);
        return ApiResponse.noContent();
    }

    @DeleteMapping("/{gymId}")
    public ApiResponse<Void> deleteGym(
            @PathVariable Long gymId,
            @RequestParam(defaultValue = "false") boolean force) {
        platformGymService.deleteGym(gymId, force);
        return ApiResponse.noContent();
    }
}
