package com.sgg.tenancy.service;

import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.tenancy.dto.GymDto;
import com.sgg.tenancy.dto.GymPublicDto;
import com.sgg.tenancy.entity.Gym;
import com.sgg.tenancy.entity.GymStatus;
import com.sgg.tenancy.entity.GymType;
import com.sgg.tenancy.mapper.GymMapper;
import com.sgg.tenancy.repository.GymRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GymServiceImpl implements GymService {

    private final GymRepository gymRepository;
    private final GymMapper gymMapper;

    @Override
    public GymPublicDto searchBySlug(String slug) {
        return gymRepository.findBySlugAndStatusAndType(slug, GymStatus.ACTIVE, GymType.STANDARD)
            .map(gymMapper::toPublicDto)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
    }

    @Override
    public List<GymPublicDto> searchByName(String query) {
        if (query == null || query.trim().length() < 2) {
            return List.of();
        }
        return gymRepository.findTop10ByNameContainingIgnoreCaseAndStatusAndTypeAndDeletedAtIsNullOrderByNameAsc(
                query.trim(), GymStatus.ACTIVE, GymType.STANDARD)
            .stream()
            .map(gymMapper::toPublicDto)
            .toList();
    }

    @Override
    public GymDto getGymInfo(Long gymId) {
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
        if (gym.getType() == GymType.PERSONAL) {
            throw new ResourceNotFoundException("Gym no encontrado");
        }
        return gymMapper.toDto(gym);
    }

    @Override
    @Transactional
    public void updateAutoAccept(Long gymId, boolean autoAccept) {
        Gym gym = gymRepository.findByIdAndDeletedAtIsNull(gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Gym no encontrado"));
        gym.setAutoAcceptMembers(autoAccept);
        gymRepository.save(gym);
    }
}
