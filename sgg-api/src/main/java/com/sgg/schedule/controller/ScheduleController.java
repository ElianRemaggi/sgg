package com.sgg.schedule.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.schedule.dto.CreateScheduleActivityRequest;
import com.sgg.schedule.dto.ScheduleActivityDto;
import com.sgg.schedule.dto.UpdateScheduleActivityRequest;
import com.sgg.schedule.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gyms/{gymId}")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping("/schedule")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ScheduleActivityDto>>> getSchedule(
            @PathVariable Long gymId) {
        return ResponseEntity.ok(ApiResponse.ok(scheduleService.getActiveActivities(gymId)));
    }

    @PostMapping("/admin/schedule")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<ScheduleActivityDto>> create(
            @PathVariable Long gymId,
            @Valid @RequestBody CreateScheduleActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(scheduleService.create(gymId, request)));
    }

    @PutMapping("/admin/schedule/{activityId}")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<ScheduleActivityDto>> update(
            @PathVariable Long gymId,
            @PathVariable Long activityId,
            @Valid @RequestBody UpdateScheduleActivityRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(scheduleService.update(gymId, activityId, request)));
    }

    @DeleteMapping("/admin/schedule/{activityId}")
    @PreAuthorize("@gymAccessChecker.isAdmin(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @PathVariable Long gymId,
            @PathVariable Long activityId) {
        scheduleService.deactivate(gymId, activityId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
