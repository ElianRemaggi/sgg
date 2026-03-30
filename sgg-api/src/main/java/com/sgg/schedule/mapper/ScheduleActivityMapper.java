package com.sgg.schedule.mapper;

import com.sgg.schedule.dto.ScheduleActivityDto;
import com.sgg.schedule.entity.ScheduleActivity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Mapper(componentModel = "spring")
public interface ScheduleActivityMapper {

    @Mapping(target = "dayName", source = "dayOfWeek", qualifiedByName = "dayName")
    @Mapping(target = "startTime", source = "startTime", qualifiedByName = "formatTime")
    @Mapping(target = "endTime", source = "endTime", qualifiedByName = "formatTime")
    ScheduleActivityDto toDto(ScheduleActivity entity);

    @Named("dayName")
    static String toDayName(Integer dayOfWeek) {
        return switch (dayOfWeek) {
            case 1 -> "Lunes";
            case 2 -> "Martes";
            case 3 -> "Miércoles";
            case 4 -> "Jueves";
            case 5 -> "Viernes";
            case 6 -> "Sábado";
            case 7 -> "Domingo";
            default -> "Desconocido";
        };
    }

    @Named("formatTime")
    static String formatTime(LocalTime time) {
        return time != null ? time.format(DateTimeFormatter.ofPattern("HH:mm")) : null;
    }
}
