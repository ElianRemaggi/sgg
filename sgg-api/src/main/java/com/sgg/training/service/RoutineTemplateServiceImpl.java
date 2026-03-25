package com.sgg.training.service;

import com.sgg.common.exception.BusinessException;
import com.sgg.common.exception.ResourceNotFoundException;
import com.sgg.common.security.SecurityUtils;
import com.sgg.identity.entity.User;
import com.sgg.identity.repository.UserRepository;
import com.sgg.training.dto.*;
import com.sgg.training.entity.RoutineTemplate;
import com.sgg.training.entity.TemplateBlock;
import com.sgg.training.entity.TemplateExercise;
import com.sgg.training.mapper.RoutineTemplateMapper;
import com.sgg.training.repository.RoutineAssignmentRepository;
import com.sgg.training.repository.RoutineTemplateRepository;
import com.sgg.training.repository.TemplateBlockRepository;
import com.sgg.training.repository.TemplateExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoutineTemplateServiceImpl implements RoutineTemplateService {

    private static final Logger log = LoggerFactory.getLogger(RoutineTemplateServiceImpl.class);

    private final RoutineTemplateRepository templateRepository;
    private final TemplateBlockRepository blockRepository;
    private final TemplateExerciseRepository exerciseRepository;
    private final RoutineAssignmentRepository assignmentRepository;
    private final RoutineTemplateMapper mapper;
    private final SecurityUtils securityUtils;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<RoutineTemplateSummaryDto> findByGym(Long gymId) {
        List<RoutineTemplate> templates = templateRepository.findByGymIdAndNotDeleted(gymId);
        if (templates.isEmpty()) return List.of();

        // Batch fetch blocks for all templates (fix N+1)
        List<Long> templateIds = templates.stream().map(RoutineTemplate::getId).toList();
        Map<Long, Long> blocksCountByTemplate = blockRepository.findByTemplateIdInOrderBySortOrder(templateIds)
            .stream()
            .collect(Collectors.groupingBy(TemplateBlock::getTemplateId, Collectors.counting()));

        // Batch fetch creators (fix N+1)
        List<Long> creatorIds = templates.stream().map(RoutineTemplate::getCreatedBy).distinct().toList();
        Map<Long, User> usersById = userRepository.findAllById(creatorIds)
            .stream()
            .collect(Collectors.toMap(User::getId, Function.identity()));

        return templates.stream().map(t -> {
            User creator = usersById.get(t.getCreatedBy());
            return new RoutineTemplateSummaryDto(
                t.getId(),
                t.getName(),
                t.getDescription(),
                blocksCountByTemplate.getOrDefault(t.getId(), 0L).intValue(),
                creator != null ? new RoutineTemplateSummaryDto.CreatorDto(creator.getId(), creator.getFullName()) : null,
                t.getCreatedAt()
            );
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoutineTemplateDetailDto findById(Long gymId, Long templateId) {
        RoutineTemplate template = findOrThrow(gymId, templateId);
        return buildDetailDto(template);
    }

    @Override
    public RoutineTemplateDetailDto create(Long gymId, CreateRoutineTemplateRequest request) {
        Long currentUserId = securityUtils.getCurrentUserId();

        RoutineTemplate template = new RoutineTemplate();
        template.setGymId(gymId);
        template.setName(request.name());
        template.setDescription(request.description());
        template.setCreatedBy(currentUserId);
        template = templateRepository.save(template);

        saveBlocksAndExercises(template.getId(), request.blocks());

        log.info("Template created: gymId={}, templateId={}, name={}", gymId, template.getId(), template.getName());
        return buildDetailDto(template);
    }

    @Override
    public RoutineTemplateDetailDto update(Long gymId, Long templateId, CreateRoutineTemplateRequest request) {
        RoutineTemplate template = findOrThrow(gymId, templateId);

        if (assignmentRepository.hasActiveAssignments(templateId)) {
            throw new BusinessException("No se puede editar una plantilla con asignaciones activas");
        }

        // Delete existing blocks and exercises
        List<TemplateBlock> existingBlocks = blockRepository.findByTemplateIdOrderBySortOrder(templateId);
        List<Long> blockIds = existingBlocks.stream().map(TemplateBlock::getId).toList();
        if (!blockIds.isEmpty()) {
            exerciseRepository.deleteByBlockIdIn(blockIds);
        }
        blockRepository.deleteByTemplateId(templateId);

        // Update template fields
        template.setName(request.name());
        template.setDescription(request.description());
        templateRepository.save(template);

        // Re-create blocks and exercises
        saveBlocksAndExercises(templateId, request.blocks());

        log.info("Template updated: gymId={}, templateId={}", gymId, templateId);
        return buildDetailDto(template);
    }

    @Override
    public void delete(Long gymId, Long templateId) {
        RoutineTemplate template = findOrThrow(gymId, templateId);

        if (assignmentRepository.hasActiveAssignments(templateId)) {
            throw new BusinessException("No se puede eliminar una plantilla con asignaciones activas");
        }

        template.setDeletedAt(LocalDateTime.now());
        templateRepository.save(template);
        log.info("Template soft-deleted: gymId={}, templateId={}", gymId, templateId);
    }

    // BUG-04 fix: use DB-level gym check instead of findById + Java filter
    private RoutineTemplate findOrThrow(Long gymId, Long templateId) {
        return templateRepository.findByIdAndGymIdAndDeletedAtIsNull(templateId, gymId)
            .orElseThrow(() -> new ResourceNotFoundException("Plantilla no encontrada: id=" + templateId));
    }

    // BUG-06 fix: batch save blocks, then batch save exercises
    private void saveBlocksAndExercises(Long templateId, List<CreateRoutineTemplateRequest.BlockRequest> blockRequests) {
        if (blockRequests == null) return;

        List<TemplateBlock> blocks = new ArrayList<>();
        for (int i = 0; i < blockRequests.size(); i++) {
            CreateRoutineTemplateRequest.BlockRequest br = blockRequests.get(i);
            TemplateBlock block = new TemplateBlock();
            block.setTemplateId(templateId);
            block.setName(br.name());
            block.setDayNumber(br.dayNumber());
            block.setSortOrder(br.sortOrder() != null ? br.sortOrder() : i * 10);
            blocks.add(block);
        }
        blocks = blockRepository.saveAll(blocks);

        List<TemplateExercise> allExercises = new ArrayList<>();
        for (int i = 0; i < blocks.size(); i++) {
            TemplateBlock savedBlock = blocks.get(i);
            List<CreateRoutineTemplateRequest.ExerciseRequest> exercises = blockRequests.get(i).exercises();
            if (exercises != null) {
                for (int j = 0; j < exercises.size(); j++) {
                    CreateRoutineTemplateRequest.ExerciseRequest er = exercises.get(j);
                    TemplateExercise exercise = new TemplateExercise();
                    exercise.setBlockId(savedBlock.getId());
                    exercise.setName(er.name());
                    exercise.setSets(er.sets());
                    exercise.setReps(er.reps());
                    exercise.setRestSeconds(er.restSeconds());
                    exercise.setNotes(er.notes());
                    exercise.setSortOrder(er.sortOrder() != null ? er.sortOrder() : j * 10);
                    allExercises.add(exercise);
                }
            }
        }
        if (!allExercises.isEmpty()) {
            exerciseRepository.saveAll(allExercises);
        }
    }

    private RoutineTemplateDetailDto buildDetailDto(RoutineTemplate template) {
        List<TemplateBlock> blocks = blockRepository.findByTemplateIdOrderBySortOrder(template.getId());
        List<Long> blockIds = blocks.stream().map(TemplateBlock::getId).toList();

        Map<Long, List<TemplateExercise>> exercisesByBlock;
        if (!blockIds.isEmpty()) {
            exercisesByBlock = exerciseRepository.findByBlockIdInOrderBySortOrder(blockIds)
                .stream()
                .collect(Collectors.groupingBy(TemplateExercise::getBlockId));
        } else {
            exercisesByBlock = Map.of();
        }

        List<TemplateBlockDto> blockDtos = blocks.stream().map(block -> {
            List<TemplateExerciseDto> exerciseDtos = exercisesByBlock
                .getOrDefault(block.getId(), List.of())
                .stream()
                .map(mapper::toExerciseDto)
                .toList();
            return new TemplateBlockDto(
                block.getId(),
                block.getName(),
                block.getDayNumber(),
                block.getSortOrder(),
                exerciseDtos
            );
        }).toList();

        User creator = userRepository.findById(template.getCreatedBy()).orElse(null);

        return new RoutineTemplateDetailDto(
            template.getId(),
            template.getName(),
            template.getDescription(),
            blockDtos,
            creator != null ? new RoutineTemplateSummaryDto.CreatorDto(creator.getId(), creator.getFullName()) : null,
            template.getCreatedAt()
        );
    }
}
