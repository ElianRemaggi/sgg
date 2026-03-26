package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;
import com.sgg.tenancy.service.GymService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class GymSearchController {

    private final GymService gymService;

    @GetMapping("/api/gyms/search")
    public ResponseEntity<ApiResponse<GymPublicDto>> searchBySlug(@RequestParam String slug) {
        GymPublicDto gym = gymService.searchBySlug(slug);
        return ResponseEntity.ok(ApiResponse.ok(gym));
    }

    @GetMapping("/api/gyms/search/by-name")
    public ResponseEntity<ApiResponse<List<GymPublicDto>>> searchByName(@RequestParam String q) {
        List<GymPublicDto> gyms = gymService.searchByName(q);
        return ResponseEntity.ok(ApiResponse.ok(gyms));
    }

    @GetMapping("/api/gyms/{gymId}/info")
    public ResponseEntity<ApiResponse<GymDto>> getGymInfo(@PathVariable Long gymId) {
        GymDto gym = gymService.getGymInfo(gymId);
        return ResponseEntity.ok(ApiResponse.ok(gym));
    }
}
