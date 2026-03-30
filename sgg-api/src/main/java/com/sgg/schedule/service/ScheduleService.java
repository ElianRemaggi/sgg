package com.sgg.schedule.service;

import com.sgg.schedule.dto.CreateScheduleActivityRequest;
import com.sgg.schedule.dto.ScheduleActivityDto;
import com.sgg.schedule.dto.UpdateScheduleActivityRequest;

import java.util.List;

public interface ScheduleService {

    List<ScheduleActivityDto> getActiveActivities(Long gymId);

    ScheduleActivityDto create(Long gymId, CreateScheduleActivityRequest request);

    ScheduleActivityDto update(Long gymId, Long activityId, UpdateScheduleActivityRequest request);

    void deactivate(Long gymId, Long activityId);
}
