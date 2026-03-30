package com.sgg.tracking.service;

import com.sgg.tracking.dto.*;

public interface TrackingService {

    ExerciseCompletionDto completeExercise(Long gymId, CompleteExerciseRequest request);

    void undoExercise(Long gymId, UndoExerciseRequest request);

    TrackingProgressDto getProgress(Long gymId);

    TrackingProgressDto getMemberProgress(Long gymId, Long memberId);
}
