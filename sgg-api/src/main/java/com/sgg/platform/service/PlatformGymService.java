package com.sgg.platform.service;

import com.sgg.platform.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PlatformGymService {

    Page<GymSummaryDto> listGyms(String status, String search, Pageable pageable);

    GymDetailDto getGymDetail(Long gymId);

    GymDetailDto createGym(CreateGymRequest request);

    GymDetailDto updateGym(Long gymId, UpdateGymRequest request);

    void changeGymStatus(Long gymId, ChangeGymStatusRequest request);

    void deleteGym(Long gymId, boolean force);
}
