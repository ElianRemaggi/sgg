package com.sgg.training.service;

import com.sgg.training.dto.AssignRoutineRequest;
import com.sgg.training.dto.MemberRoutineDto;
import com.sgg.training.dto.RoutineAssignmentDto;

import java.util.List;

public interface RoutineAssignmentService {

    RoutineAssignmentDto assign(Long gymId, AssignRoutineRequest request);

    MemberRoutineDto getActiveRoutine(Long gymId, Long memberUserId);

    List<RoutineAssignmentDto> getHistory(Long gymId, Long memberUserId);
}
