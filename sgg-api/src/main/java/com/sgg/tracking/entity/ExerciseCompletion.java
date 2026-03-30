package com.sgg.tracking.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exercise_completions")
@Getter @Setter @NoArgsConstructor
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
public class ExerciseCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "assignment_id", nullable = false)
    private Long assignmentId;

    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = true;

    @Column(name = "weight_kg", precision = 6, scale = 2)
    private BigDecimal weightKg;

    @Column(name = "actual_reps")
    private Integer actualReps;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at", nullable = false)
    private LocalDateTime completedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (completedAt == null) {
            completedAt = LocalDateTime.now();
        }
    }
}
