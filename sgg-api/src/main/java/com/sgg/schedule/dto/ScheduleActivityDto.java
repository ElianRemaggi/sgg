package com.sgg.schedule.dto;

public record ScheduleActivityDto(
        Long id,
        String name,
        String description,
        Integer dayOfWeek,
        String dayName,
        String startTime,
        String endTime,
        Boolean isActive
) {}
