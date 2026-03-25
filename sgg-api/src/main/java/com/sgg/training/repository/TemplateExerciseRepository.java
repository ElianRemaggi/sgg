package com.sgg.training.repository;

import com.sgg.training.entity.TemplateExercise;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateExerciseRepository extends JpaRepository<TemplateExercise, Long> {

    List<TemplateExercise> findByBlockIdOrderBySortOrder(Long blockId);

    List<TemplateExercise> findByBlockIdInOrderBySortOrder(List<Long> blockIds);

    void deleteByBlockIdIn(List<Long> blockIds);
}
