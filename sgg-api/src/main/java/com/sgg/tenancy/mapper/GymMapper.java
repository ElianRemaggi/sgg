package com.sgg.tenancy.mapper;

import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;
import com.sgg.tenancy.entity.Gym;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface GymMapper {

    GymDto toDto(Gym gym);

    GymPublicDto toPublicDto(Gym gym);
}
