package com.sgg.identity.mapper;

import com.sgg.identity.dto.UserDto;
import com.sgg.identity.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {

    UserDto toDto(User user);
}
