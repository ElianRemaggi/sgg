package com.sgg.tenancy.repository;

import com.sgg.tenancy.dto.GymMemberDto;
import com.sgg.tenancy.entity.GymMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GymMemberRepository extends JpaRepository<GymMember, Long> {

    Optional<GymMember> findByGymIdAndUserId(Long gymId, Long userId);

    Optional<GymMember> findByGymIdAndUserIdAndStatus(Long gymId, Long userId, String status);

    boolean existsByGymIdAndUserIdAndStatusIn(Long gymId, Long userId, List<String> statuses);

    @Query("""
        SELECT new com.sgg.tenancy.dto.GymMemberDto(
            gm.id, u.id, u.fullName, u.email, u.avatarUrl,
            gm.role, gm.status, gm.membershipExpiresAt, gm.createdAt
        )
        FROM GymMember gm JOIN com.sgg.identity.entity.User u ON gm.userId = u.id
        WHERE gm.gymId = :gymId
        AND (:status IS NULL OR gm.status = :status)
        AND (:role IS NULL OR gm.role = :role)
        ORDER BY gm.createdAt DESC
    """)
    Page<GymMemberDto> findMembersByGymWithFilters(
        @Param("gymId") Long gymId,
        @Param("status") String status,
        @Param("role") String role,
        Pageable pageable
    );

    List<GymMember> findByUserId(Long userId);

    long countByGymIdAndStatus(Long gymId, String status);

    long countByGymIdAndRoleAndStatus(Long gymId, String role, String status);
}
