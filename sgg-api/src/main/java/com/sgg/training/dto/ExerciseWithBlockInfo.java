package com.sgg.training.dto;

public record ExerciseWithBlockInfo(
        Long exerciseId,
        String exerciseName,
        Long blockId,
        String blockName,
        Integer dayNumber,
        Long templateId
) {}
