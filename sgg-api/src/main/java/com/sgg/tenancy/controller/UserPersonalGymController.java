package com.sgg.tenancy.controller;

import com.sgg.common.dto.ApiResponse;
import com.sgg.common.security.SecurityUtils;
import com.sgg.tenancy.dto.PersonalGymResponse;
import com.sgg.tenancy.service.PersonalGymService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserPersonalGymController {

    private final PersonalGymService personalGymService;
    private final SecurityUtils securityUtils;

    @PostMapping("/personal-gym")
    public ResponseEntity<ApiResponse<PersonalGymResponse>> ensurePersonalGym() {
        Long userId = securityUtils.getCurrentUserId();
        PersonalGymResponse response = personalGymService.ensurePersonalGym(userId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
