package com.sgg.platform.service;

import com.sgg.platform.dto.GymRequestDto;
import com.sgg.platform.dto.GymRequestSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface GymRequestService {

    GymRequestDto submit(GymRequestSubmission submission);

    Page<GymRequestDto> list(String status, Pageable pageable);

    GymRequestDto updateStatus(Long id, String status);
}
