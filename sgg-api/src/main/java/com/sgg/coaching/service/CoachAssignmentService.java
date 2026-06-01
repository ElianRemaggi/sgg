package com.sgg.coaching.service;

import com.sgg.coaching.dto.AssignCoachRequest;
import com.sgg.coaching.dto.AssignedMemberDto;
import com.sgg.coaching.dto.CoachAssignmentDto;
import com.sgg.coaching.dto.CoachSummaryDto;

import java.util.List;

public interface CoachAssignmentService {

    List<CoachSummaryDto> listCoaches(Long gymId);

    CoachAssignmentDto assignCoach(Long gymId, AssignCoachRequest request);

    void unassignCoach(Long gymId, Long assignmentId);

    List<AssignedMemberDto> getMyMembers(Long gymId);

    boolean hasActiveAssignmentsAsCoach(Long gymId, Long userId);
}
