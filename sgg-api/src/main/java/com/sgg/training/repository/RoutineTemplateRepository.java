package com.sgg.training.repository;

import com.sgg.training.entity.RoutineTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoutineTemplateRepository extends JpaRepository<RoutineTemplate, Long> {

    Optional<RoutineTemplate> findByIdAndDeletedAtIsNull(Long id);

    Optional<RoutineTemplate> findByIdAndGymIdAndDeletedAtIsNull(Long id, Long gymId);

    List<RoutineTemplate> findAllByDeletedAtIsNull();

    List<RoutineTemplate> findByIdIn(List<Long> ids);

    @Query("""
        SELECT rt FROM RoutineTemplate rt
        WHERE rt.gymId = :gymId AND rt.deletedAt IS NULL
        ORDER BY rt.createdAt DESC
    """)
    List<RoutineTemplate> findByGymIdAndNotDeleted(@Param("gymId") Long gymId);
}
