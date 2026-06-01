package com.sgg.platform.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.platform.dto.GymRequestDto;
import com.sgg.platform.dto.GymRequestSubmission;
import com.sgg.platform.service.GymRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/gym-requests")
@RequiredArgsConstructor
public class PublicGymRequestController {

    private final GymRequestService gymRequestService;

    @PostMapping
    public ResponseEntity<ApiResponse<GymRequestDto>> submit(
            @Valid @RequestBody GymRequestSubmission submission) {
        GymRequestDto created = gymRequestService.submit(submission);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }
}
