package com.sgg.training.service;

import com.sgg.training.dto.RoutineTemplateDetailDto;

public interface RoutineExportService {
    byte[] toXlsx(RoutineTemplateDetailDto dto);
    byte[] toCsv(RoutineTemplateDetailDto dto);
}
