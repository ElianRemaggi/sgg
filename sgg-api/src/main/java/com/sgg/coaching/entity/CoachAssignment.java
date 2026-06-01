package com.sgg.coaching.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.LocalDateTime;

@Entity
@Table(name = "coach_assignments")
@Getter
@Setter
@NoArgsConstructor
@Filter(name = "tenantFilter", condition = "gym_id = :gymId")
public class CoachAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "gym_id", nullable = false)
    private Long gymId;

    @Column(name = "coach_user_id", nullable = false)
    private Long coachUserId;

    @Column(name = "member_user_id", nullable = false)
    private Long memberUserId;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "unassigned_at")
    private LocalDateTime unassignedAt;

    @PrePersist
    void prePersist() {
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }

    public boolean isActive() {
        return unassignedAt == null;
    }
}
