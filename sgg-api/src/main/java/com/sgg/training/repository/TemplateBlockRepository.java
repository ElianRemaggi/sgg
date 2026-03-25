package com.sgg.training.repository;

import com.sgg.training.entity.TemplateBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateBlockRepository extends JpaRepository<TemplateBlock, Long> {

    List<TemplateBlock> findByTemplateIdOrderBySortOrder(Long templateId);

    List<TemplateBlock> findByTemplateIdInOrderBySortOrder(List<Long> templateIds);

    void deleteByTemplateId(Long templateId);
}
