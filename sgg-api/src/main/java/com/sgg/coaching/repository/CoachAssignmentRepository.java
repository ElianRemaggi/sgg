package com.sgg.coaching.repository;

import com.sgg.coaching.dto.CoachSummaryDto;
import com.sgg.coaching.entity.CoachAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoachAssignmentRepository extends JpaRepository<CoachAssignment, Long> {

    Optional<CoachAssignment> findByIdAndGymId(Long id, Long gymId);

    List<CoachAssignment> findByGymIdAndCoachUserIdAndUnassignedAtIsNull(Long gymId, Long coachUserId);

    boolean existsByGymIdAndMemberUserIdAndUnassignedAtIsNull(Long gymId, Long memberUserId);

    boolean existsByGymIdAndCoachUserIdAndUnassignedAtIsNull(Long gymId, Long coachUserId);

    @Query("""
        SELECT new com.sgg.coaching.dto.CoachSummaryDto(
            u.id, u.fullName, u.email,
            (SELECT COUNT(ca) FROM CoachAssignment ca
             WHERE ca.coachUserId = gm.userId
             AND ca.gymId = :gymId
             AND ca.unassignedAt IS NULL)
        )
        FROM com.sgg.tenancy.entity.GymMember gm
        JOIN com.sgg.identity.entity.User u ON gm.userId = u.id
        WHERE gm.gymId = :gymId
        AND gm.role IN ('COACH', 'ADMIN_COACH')
        AND gm.status = 'ACTIVE'
        ORDER BY u.fullName ASC
    """)
    List<CoachSummaryDto> findCoachesWithAssignmentCount(@Param("gymId") Long gymId);
}
