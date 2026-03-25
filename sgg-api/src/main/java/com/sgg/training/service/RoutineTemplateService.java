package com.sgg.training.service;

import com.sgg.training.dto.CreateRoutineTemplateRequest;
import com.sgg.training.dto.RoutineTemplateDetailDto;
import com.sgg.training.dto.RoutineTemplateSummaryDto;

import java.util.List;

public interface RoutineTemplateService {

    List<RoutineTemplateSummaryDto> findByGym(Long gymId);

    RoutineTemplateDetailDto findById(Long gymId, Long templateId);

    RoutineTemplateDetailDto create(Long gymId, CreateRoutineTemplateRequest request);

    RoutineTemplateDetailDto update(Long gymId, Long templateId, CreateRoutineTemplateRequest request);

    void delete(Long gymId, Long templateId);
}
