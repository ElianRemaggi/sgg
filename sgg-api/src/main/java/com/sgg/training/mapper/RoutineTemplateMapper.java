package com.sgg.training.mapper;

import com.sgg.training.dto.TemplateBlockDto;
import com.sgg.training.dto.TemplateExerciseDto;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface RoutineTemplateMapper {

    TemplateBlockDto toBlockDto(TemplateBlock block);

    TemplateExerciseDto toExerciseDto(TemplateExercise exercise);
}
