package com.sgg.tracking.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.tracking.dto.*;
import com.sgg.tracking.service.TrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/gyms/{gymId}")
@RequiredArgsConstructor
public class TrackingController {

    private final TrackingService trackingService;

    @PostMapping("/member/tracking/complete")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<ExerciseCompletionDto>> completeExercise(
            @PathVariable Long gymId,
            @Valid @RequestBody CompleteExerciseRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(trackingService.completeExercise(gymId, request)));
    }

    @PostMapping("/member/tracking/undo")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<Void>> undoExercise(
            @PathVariable Long gymId,
            @Valid @RequestBody UndoExerciseRequest request) {
        trackingService.undoExercise(gymId, request);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/member/tracking/progress")
    @PreAuthorize("@gymAccessChecker.isMember(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<TrackingProgressDto>> getProgress(
            @PathVariable Long gymId) {
        return ResponseEntity.ok(ApiResponse.ok(trackingService.getProgress(gymId)));
    }

    @GetMapping("/coach/tracking/{memberId}")
    @PreAuthorize("@gymAccessChecker.isCoach(#gymId) or hasRole('SUPERADMIN')")
    public ResponseEntity<ApiResponse<TrackingProgressDto>> getMemberProgress(
            @PathVariable Long gymId,
            @PathVariable Long memberId) {
        return ResponseEntity.ok(ApiResponse.ok(trackingService.getMemberProgress(gymId, memberId)));
    }
}
