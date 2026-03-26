package com.sgg.tenancy.repository;

import com.sgg.tenancy.entity.Gym;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GymRepository extends JpaRepository<Gym, Long> {

    Optional<Gym> findBySlugAndStatus(String slug, String status);

    Optional<Gym> findByIdAndDeletedAtIsNull(Long id);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    List<Gym> findTop10ByNameContainingIgnoreCaseAndStatusAndDeletedAtIsNullOrderByNameAsc(String name, String status);

    @Query("""
        SELECT g FROM Gym g
        WHERE (:status IS NULL OR g.status = :status)
        AND (:search IS NULL OR LOWER(CAST(g.name AS String)) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%'))
             OR LOWER(CAST(g.slug AS String)) LIKE LOWER(CONCAT('%', CAST(:search AS String), '%')))
        ORDER BY g.createdAt DESC
    """)
    Page<Gym> findAllWithFilters(
        @Param("status") String status,
        @Param("search") String search,
        Pageable pageable
    );
}
