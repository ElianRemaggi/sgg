package com.sgg.training.service;

import com.sgg.training.dto.AssignmentInfo;
import com.sgg.training.dto.BlockWithExercisesInfo;
import com.sgg.training.dto.ExerciseInfo;
import com.sgg.training.dto.ExerciseWithBlockInfo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface RoutineQueryService {

    Optional<AssignmentInfo> findActiveAssignment(Long userId, Long gymId);

    Optional<AssignmentInfo> findAssignmentById(Long assignmentId);

    List<AssignmentInfo> findMemberAssignments(Long userId, Long gymId);

    Page<AssignmentInfo> findMemberAssignments(Long userId, Long gymId, Pageable pageable);

    Map<Long, String> findTemplateNames(List<Long> templateIds);

    List<ExerciseInfo> findExercisesByTemplateId(Long templateId);

    boolean exerciseBelongsToTemplate(Long exerciseId, Long templateId);

    List<BlockWithExercisesInfo> findBlocksWithExercises(Long templateId);

    Optional<ExerciseWithBlockInfo> findExerciseWithBlock(Long exerciseId);
}
