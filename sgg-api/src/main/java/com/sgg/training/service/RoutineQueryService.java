package com.sgg.training.service;

import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.BlockWithExercisesInfo;
import com.sgg.training.dto.ExerciseInfo;
import com.sgg.training.dto.ExerciseWithBlockInfo;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface RoutineQueryService {

    Optional<AssignmentInfo> findActiveAssignment(Long userId, Long gymId);

    Optional<AssignmentInfo> findAssignmentById(Long assignmentId);

    List<AssignmentInfo> findMemberAssignments(Long userId, Long gymId);

    Map<Long, String> findTemplateNames(List<Long> templateIds);

    List<ExerciseInfo> findExercisesByTemplateId(Long templateId);

    boolean exerciseBelongsToTemplate(Long exerciseId, Long templateId);

    List<BlockWithExercisesInfo> findBlocksWithExercises(Long templateId);

    Optional<ExerciseWithBlockInfo> findExerciseWithBlock(Long exerciseId);
}
