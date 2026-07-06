package com.sgg.tracking.service;

import com.sgg.tracking.dto.AssignmentHistoryDetailDto;
import com.sgg.tracking.dto.AssignmentHistorySummaryDto;
import com.sgg.tracking.dto.ExerciseProgressDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface RoutineHistoryService {

    Page<AssignmentHistorySummaryDto> getMemberHistory(Long gymId, Long userId, Pageable pageable);

    AssignmentHistoryDetailDto getAssignmentDetail(Long gymId, Long userId, Long assignmentId);

    ExerciseProgressDto getExerciseProgress(Long gymId, Long userId, Long assignmentId, Long exerciseId);
}
