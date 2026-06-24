package com.sgg.tenancy.service;

import com.sgg.tenancy.dto.PersonalGymResponse;

public interface PersonalGymService {
    PersonalGymResponse ensurePersonalGym(Long userId);
}
