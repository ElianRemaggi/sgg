package com.sgg.training.repository;

import com.sgg.training.entity.TemplateExercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TemplateExerciseRepository extends JpaRepository<TemplateExercise, Long> {

    List<TemplateExercise> findByBlockIdOrderBySortOrder(Long blockId);

    List<TemplateExercise> findByBlockIdInOrderBySortOrder(List<Long> blockIds);

    void deleteByBlockIdIn(List<Long> blockIds);

    @Query("""
        SELECT COUNT(e) > 0 FROM TemplateExercise e
        JOIN TemplateBlock b ON e.blockId = b.id
        WHERE e.id = :exerciseId AND b.templateId = :templateId
    """)
    boolean existsByIdAndTemplateId(@Param("exerciseId") Long exerciseId,
                                    @Param("templateId") Long templateId);
}
