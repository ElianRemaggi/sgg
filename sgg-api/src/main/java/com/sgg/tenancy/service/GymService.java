package com.sgg.tenancy.service;

import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;

public interface GymService {

    GymPublicDto searchBySlug(String slug);

    GymDto getGymInfo(Long gymId);
}
