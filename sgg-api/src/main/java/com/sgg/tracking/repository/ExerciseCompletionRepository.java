package com.sgg.tracking.repository;

import com.sgg.tracking.entity.ExerciseCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExerciseCompletionRepository extends JpaRepository<ExerciseCompletion, Long> {

    Optional<ExerciseCompletion> findByAssignmentIdAndExerciseIdAndUserId(
            Long assignmentId, Long exerciseId, Long userId);

    List<ExerciseCompletion> findByAssignmentIdAndUserIdAndIsCompletedTrue(
            Long assignmentId, Long userId);

    @Query("""
        SELECT COUNT(ec) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
    """)
    long countCompletedByAssignment(@Param("assignmentId") Long assignmentId,
                                    @Param("userId") Long userId);

    @Query("""
        SELECT COUNT(ec) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId
          AND ec.isCompleted = true AND CAST(ec.completedAt AS date) = CURRENT_DATE
    """)
    long countCompletedToday(@Param("assignmentId") Long assignmentId,
                             @Param("userId") Long userId);

    @Query("""
        SELECT ec FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
        ORDER BY ec.completedAt DESC LIMIT 1
    """)
    Optional<ExerciseCompletion> findLastActivity(@Param("assignmentId") Long assignmentId,
                                                  @Param("userId") Long userId);
}
