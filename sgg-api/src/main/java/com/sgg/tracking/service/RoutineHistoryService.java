package com.sgg.tracking.service;

import com.sgg.tracking.dto.AssignmentHistoryDetailDto;
import com.sgg.tracking.dto.AssignmentHistorySummaryDto;
import com.sgg.tracking.dto.ExerciseProgressDto;

import java.util.List;

public interface RoutineHistoryService {

    List<AssignmentHistorySummaryDto> getMemberHistory(Long gymId, Long userId);

    AssignmentHistoryDetailDto getAssignmentDetail(Long gymId, Long userId, Long assignmentId);

    ExerciseProgressDto getExerciseProgress(Long gymId, Long userId, Long assignmentId, Long exerciseId);
}
