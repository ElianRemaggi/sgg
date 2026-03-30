package com.sgg.schedule.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.schedule.dto.CreateScheduleActivityRequest;
import com.sgg.schedule.dto.ScheduleActivityDto;
import com.sgg.schedule.dto.UpdateScheduleActivityRequest;
import com.sgg.schedule.entity.ScheduleActivity;
import com.sgg.schedule.mapper.ScheduleActivityMapper;
import com.sgg.schedule.repository.ScheduleActivityRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleServiceImpl.class);

    private final ScheduleActivityRepository activityRepository;
    private final ScheduleActivityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<ScheduleActivityDto> getActiveActivities(Long gymId) {
        return activityRepository
                .findByGymIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(gymId)
                .stream()
                .map(mapper::toDto)
                .toList();
    }

    @Override
    public ScheduleActivityDto create(Long gymId, CreateScheduleActivityRequest request) {
        LocalTime start = parseTime(request.startTime(), "hora de inicio");
        LocalTime end = parseTime(request.endTime(), "hora de fin");

        if (!end.isAfter(start)) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }

        ScheduleActivity activity = new ScheduleActivity();
        activity.setGymId(gymId);
        activity.setName(request.name());
        activity.setDescription(request.description());
        activity.setDayOfWeek(request.dayOfWeek());
        activity.setStartTime(start);
        activity.setEndTime(end);
        activity.setIsActive(true);

        activity = activityRepository.save(activity);
        log.info("Schedule activity created: gymId={}, id={}, name={}", gymId, activity.getId(), activity.getName());
        return mapper.toDto(activity);
    }

    @Override
    public ScheduleActivityDto update(Long gymId, Long activityId, UpdateScheduleActivityRequest request) {
        ScheduleActivity activity = activityRepository.findByIdAndGymId(activityId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada"));

        LocalTime start = parseTime(request.startTime(), "hora de inicio");
        LocalTime end = parseTime(request.endTime(), "hora de fin");

        if (!end.isAfter(start)) {
            throw new BusinessException("La hora de fin debe ser posterior a la hora de inicio");
        }

        activity.setName(request.name());
        activity.setDescription(request.description());
        activity.setDayOfWeek(request.dayOfWeek());
        activity.setStartTime(start);
        activity.setEndTime(end);

        activity = activityRepository.save(activity);
        log.info("Schedule activity updated: gymId={}, id={}", gymId, activityId);
        return mapper.toDto(activity);
    }

    @Override
    public void deactivate(Long gymId, Long activityId) {
        ScheduleActivity activity = activityRepository.findByIdAndGymId(activityId, gymId)
                .orElseThrow(() -> new ResourceNotFoundException("Actividad no encontrada"));

        activity.setIsActive(false);
        activityRepository.save(activity);
        log.info("Schedule activity deactivated: gymId={}, id={}", gymId, activityId);
    }

    private LocalTime parseTime(String timeStr, String fieldName) {
        try {
            return LocalTime.parse(timeStr);
        } catch (Exception e) {
            throw new BusinessException("Formato inválido para " + fieldName + ". Use HH:mm (ej: 09:00)");
        }
    }
}
