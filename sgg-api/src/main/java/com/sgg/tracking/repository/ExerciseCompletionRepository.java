package com.sgg.tracking.repository;

import com.sgg.tracking.entity.ExerciseCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExerciseCompletionRepository extends JpaRepository<ExerciseCompletion, Long> {

    interface ExerciseLastNoteRow {
        Long getExerciseId();
        String getNotes();
    }

    @Query("""
        SELECT ec.exerciseId AS exerciseId, ec.notes AS notes
        FROM ExerciseCompletion ec
        WHERE ec.userId = :userId
          AND ec.exerciseId IN :exerciseIds
          AND ec.isCompleted = true
          AND ec.notes IS NOT NULL
          AND ec.notes <> ''
          AND ec.sessionDate < :today
          AND ec.completedAt = (
              SELECT MAX(ec2.completedAt) FROM ExerciseCompletion ec2
              WHERE ec2.userId = :userId
                AND ec2.exerciseId = ec.exerciseId
                AND ec2.isCompleted = true
                AND ec2.notes IS NOT NULL
                AND ec2.notes <> ''
                AND ec2.sessionDate < :today
          )
    """)
    List<ExerciseLastNoteRow> findLastNotesByExerciseIds(
            @Param("userId") Long userId,
            @Param("exerciseIds") List<Long> exerciseIds,
            @Param("today") LocalDate today);

    interface AssignmentStatsRow {
        Long getAssignmentId();
        Long getSessionDays();
        Long getTotalCompletions();
        LocalDateTime getLastActivityAt();
    }

    @Query("""
        SELECT ec.assignmentId as assignmentId,
               COUNT(DISTINCT ec.sessionDate) as sessionDays,
               COUNT(ec.id) as totalCompletions,
               MAX(ec.completedAt) as lastActivityAt
        FROM ExerciseCompletion ec
        WHERE ec.userId = :userId
          AND ec.assignmentId IN :assignmentIds
          AND ec.isCompleted = true
        GROUP BY ec.assignmentId
    """)
    List<AssignmentStatsRow> findStatsBatch(@Param("userId") Long userId,
                                            @Param("assignmentIds") List<Long> assignmentIds);

    // Upsert de sesión del día
    Optional<ExerciseCompletion> findByAssignmentIdAndExerciseIdAndUserIdAndSessionDate(
            Long assignmentId, Long exerciseId, Long userId, LocalDate sessionDate);

    // Completions de hoy para la vista de rutina activa (reemplaza la lógica en memoria del service)
    List<ExerciseCompletion> findByAssignmentIdAndUserIdAndSessionDateAndIsCompletedTrue(
            Long assignmentId, Long userId, LocalDate sessionDate);

    // Para getProgress — todas las completions activas de hoy
    @Query("""
        SELECT COUNT(ec) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId
          AND ec.isCompleted = true AND ec.sessionDate = CURRENT_DATE
    """)
    long countCompletedToday(@Param("assignmentId") Long assignmentId,
                             @Param("userId") Long userId);

    // Total completions únicas (por ejercicio) en toda la asignación
    @Query("""
        SELECT COUNT(DISTINCT ec.exerciseId) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
    """)
    long countCompletedByAssignment(@Param("assignmentId") Long assignmentId,
                                    @Param("userId") Long userId);

    @Query("""
        SELECT ec FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
        ORDER BY ec.completedAt DESC LIMIT 1
    """)
    Optional<ExerciseCompletion> findLastActivity(@Param("assignmentId") Long assignmentId,
                                                  @Param("userId") Long userId);

    // --- Historial ---

    // Todas las sesiones de una asignación (para resumen de asignación)
    List<ExerciseCompletion> findByAssignmentIdAndUserIdOrderBySessionDateAsc(
            Long assignmentId, Long userId);

    // Progresión de un ejercicio en una asignación (para gráfico)
    List<ExerciseCompletion> findByAssignmentIdAndExerciseIdAndUserIdOrderBySessionDateAsc(
            Long assignmentId, Long exerciseId, Long userId);

    // Días entrenados (con al menos 1 completion) en una asignación
    @Query("""
        SELECT COUNT(DISTINCT ec.sessionDate) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
    """)
    long countDistinctSessionDays(@Param("assignmentId") Long assignmentId,
                                  @Param("userId") Long userId);

    // Total de completions (registros) en una asignación — para el summary
    @Query("""
        SELECT COUNT(ec) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
    """)
    long countTotalCompletionsByAssignment(@Param("assignmentId") Long assignmentId,
                                           @Param("userId") Long userId);

    // Última actividad de una asignación (para lastActivityAt en el summary)
    @Query("""
        SELECT MAX(ec.completedAt) FROM ExerciseCompletion ec
        WHERE ec.assignmentId = :assignmentId AND ec.userId = :userId AND ec.isCompleted = true
    """)
    Optional<java.time.LocalDateTime> findLastActivityAt(@Param("assignmentId") Long assignmentId,
                                                         @Param("userId") Long userId);
}
