package com.sgg.tracking.mapper;

import com.sgg.tracking.dto.ExerciseCompletionDto;
import com.sgg.tracking.entity.ExerciseCompletion;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ExerciseCompletionMapper {

    ExerciseCompletionDto toDto(ExerciseCompletion entity);
}
