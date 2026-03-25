package com.sgg.training.repository;

import com.sgg.training.entity.RoutineAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoutineAssignmentRepository extends JpaRepository<RoutineAssignment, Long> {

    @Query("""
        SELECT ra FROM RoutineAssignment ra
        WHERE ra.memberUserId = :memberUserId
        AND ra.gymId = :gymId
        AND (ra.endsAt IS NULL OR ra.endsAt >= CURRENT_TIMESTAMP)
        AND ra.startsAt <= CURRENT_TIMESTAMP
        ORDER BY ra.startsAt DESC
    """)
    Optional<RoutineAssignment> findActiveByMemberAndGym(
        @Param("memberUserId") Long memberUserId,
        @Param("gymId") Long gymId
    );

    List<RoutineAssignment> findByMemberUserIdAndGymIdOrderByStartsAtDesc(Long memberUserId, Long gymId);

    @Query("""
        SELECT CASE WHEN COUNT(ra) > 0 THEN true ELSE false END
        FROM RoutineAssignment ra
        WHERE ra.templateId = :templateId
        AND (ra.endsAt IS NULL OR ra.endsAt >= CURRENT_TIMESTAMP)
    """)
    boolean hasActiveAssignments(@Param("templateId") Long templateId);

    @Query("""
        SELECT CASE WHEN COUNT(ra) > 0 THEN true ELSE false END
        FROM RoutineAssignment ra
        WHERE ra.memberUserId = :memberUserId
        AND ra.gymId = :gymId
        AND (ra.endsAt IS NULL OR ra.endsAt >= CURRENT_TIMESTAMP)
        AND ra.startsAt <= CURRENT_TIMESTAMP
    """)
    boolean hasActiveAssignmentForMember(
        @Param("memberUserId") Long memberUserId,
        @Param("gymId") Long gymId
    );
}
