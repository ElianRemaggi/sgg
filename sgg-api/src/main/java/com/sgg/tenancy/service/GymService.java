package com.sgg.tenancy.service;

import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;

import java.util.List;

public interface GymService {

    GymPublicDto searchBySlug(String slug);

    List<GymPublicDto> searchByName(String query);

    GymDto getGymInfo(Long gymId);

    void updateAutoAccept(Long gymId, boolean autoAccept);
}
