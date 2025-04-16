package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillTargetDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillTarget;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.SkillTargetRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillTargetService {
    
    private final SkillTargetRepository skillTargetRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final NotificationService notificationService;
    
    /**
     * Get all skill targets
     */
    public List<SkillTargetDto> getAllSkillTargets() {
        List<SkillTarget> targets = skillTargetRepository.findAll();
        
        // Get all users for enrichment
        Map<Long, User> userMap = userRepository.findAllById(
                targets.stream().map(SkillTarget::getUserId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(User::getId, user -> user));
        
        return targets.stream()
                .map(target -> mapToDto(target, userMap.get(target.getUserId())))
                .collect(Collectors.toList());
    }
    
    /**
     * Get skill targets by user ID
     */
    public List<SkillTargetDto> getSkillTargetsByUserId(Long userId) {
        List<SkillTarget> targets = skillTargetRepository.findByUserId(userId);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return targets.stream()
                .map(target -> mapToDto(target, user))
                .collect(Collectors.toList());
    }
    
    /**
     * Get skill targets by status
     */
    public List<SkillTargetDto> getSkillTargetsByStatus(String status) {
        List<SkillTarget> targets = skillTargetRepository.findByStatus(status);
        
        // Get all users for enrichment
        Map<Long, User> userMap = userRepository.findAllById(
                targets.stream().map(SkillTarget::getUserId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(User::getId, user -> user));
        
        return targets.stream()
                .map(target -> mapToDto(target, userMap.get(target.getUserId())))
                .collect(Collectors.toList());
    }
    
    /**
     * Get skill targets by user ID and status
     */
    public List<SkillTargetDto> getSkillTargetsByUserIdAndStatus(Long userId, String status) {
        List<SkillTarget> targets = skillTargetRepository.findByUserIdAndStatus(userId, status);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return targets.stream()
                .map(target -> mapToDto(target, user))
                .collect(Collectors.toList());
    }
    
    /**
     * Get a skill target by ID
     */
    public SkillTargetDto getSkillTargetById(Long id) {
        SkillTarget target = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        User user = userRepository.findById(target.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + target.getUserId()));
        
        return mapToDto(target, user);
    }
    
    /**
     * Create a new skill target
     */
    @Transactional
    public SkillTargetDto createSkillTarget(SkillTargetDto skillTargetDto) {
        // Check if user exists
        User user = userRepository.findById(skillTargetDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + skillTargetDto.getUserId()));
        
        // If skillId is provided, check if skill exists and get its details
        if (skillTargetDto.getSkillId() != null) {
            Skill skill = skillRepository.findById(skillTargetDto.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillTargetDto.getSkillId()));
            
            skillTargetDto.setSkillName(skill.getName());
            skillTargetDto.setSkillCategory(skill.getCategory());
            skillTargetDto.setCurrentLevel(skill.getLevel());
        }
        
        // Set default status if not provided
        if (skillTargetDto.getStatus() == null || skillTargetDto.getStatus().isEmpty()) {
            skillTargetDto.setStatus("IN_PROGRESS");
        }
        
        SkillTarget skillTarget = mapToEntity(skillTargetDto);
        skillTarget.setCreatedAt(LocalDateTime.now());
        
        SkillTarget savedTarget = skillTargetRepository.save(skillTarget);
        
        // Send notification to user
        String message = "New skill target created: " + savedTarget.getSkillName() + 
                " at " + savedTarget.getTargetLevel() + " level by " + 
                savedTarget.getTargetDate() + ".";
        
        notificationService.createNotification(
                savedTarget.getUserId(),
                "New Skill Target",
                message,
                "/skill-targets/" + savedTarget.getId()
        );
        
        return mapToDto(savedTarget, user);
    }
    
    /**
     * Update a skill target
     */
    @Transactional
    public SkillTargetDto updateSkillTarget(Long id, SkillTargetDto skillTargetDto) {
        SkillTarget existingTarget = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        // Get user
        User user = userRepository.findById(existingTarget.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + existingTarget.getUserId()));
        
        // Check if status changed to ACHIEVED
        boolean statusChangedToAchieved = "ACHIEVED".equals(skillTargetDto.getStatus()) && 
                                         !"ACHIEVED".equals(existingTarget.getStatus());
        
        // Update fields
        if (skillTargetDto.getSkillName() != null) {
            existingTarget.setSkillName(skillTargetDto.getSkillName());
        }
        
        if (skillTargetDto.getSkillCategory() != null) {
            existingTarget.setSkillCategory(skillTargetDto.getSkillCategory());
        }
        
        if (skillTargetDto.getCurrentLevel() != null) {
            existingTarget.setCurrentLevel(skillTargetDto.getCurrentLevel());
        }
        
        if (skillTargetDto.getTargetLevel() != null) {
            existingTarget.setTargetLevel(skillTargetDto.getTargetLevel());
        }
        
        if (skillTargetDto.getTargetDate() != null) {
            existingTarget.setTargetDate(skillTargetDto.getTargetDate());
        }
        
        if (skillTargetDto.getStatus() != null) {
            existingTarget.setStatus(skillTargetDto.getStatus());
        }
        
        if (skillTargetDto.getProgressNotes() != null) {
            existingTarget.setProgressNotes(skillTargetDto.getProgressNotes());
        }
        
        if (skillTargetDto.getResources() != null) {
            existingTarget.setResources(skillTargetDto.getResources());
        }
        
        existingTarget.setUpdatedAt(LocalDateTime.now());
        
        SkillTarget updatedTarget = skillTargetRepository.save(existingTarget);
        
        // If status changed to ACHIEVED, check if there's an associated skill to update
        if (statusChangedToAchieved && updatedTarget.getSkillId() != null) {
            Optional<Skill> skillOpt = skillRepository.findById(updatedTarget.getSkillId());
            
            if (skillOpt.isPresent()) {
                Skill skill = skillOpt.get();
                skill.setLevel(updatedTarget.getTargetLevel());
                skill.setUpdatedAt(LocalDateTime.now());
                skillRepository.save(skill);
                
                // Send notification about skill level update
                String message = "Your skill " + skill.getName() + 
                        " has been updated to " + skill.getLevel() + " level based on achieved target.";
                
                notificationService.createNotification(
                        updatedTarget.getUserId(),
                        "Skill Level Updated",
                        message,
                        "/skills/" + skill.getId()
                );
            }
        }
        
        return mapToDto(updatedTarget, user);
    }
    
    /**
     * Delete a skill target
     */
    @Transactional
    public void deleteSkillTarget(Long id) {
        SkillTarget target = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        skillTargetRepository.delete(target);
    }
    
    /**
     * Get expired skill targets for a user
     */
    public List<SkillTargetDto> getExpiredTargetsForUser(Long userId) {
        LocalDate currentDate = LocalDate.now();
        List<SkillTarget> expiredTargets = skillTargetRepository.findExpiredTargetsForUser(userId, currentDate);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return expiredTargets.stream()
                .map(target -> mapToDto(target, user))
                .collect(Collectors.toList());
    }
    
    /**
     * Update status of expired targets
     * This is scheduled to run daily at midnight
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void updateExpiredTargets() {
        LocalDate currentDate = LocalDate.now();
        List<SkillTarget> expiredTargets = skillTargetRepository.findExpiredTargets(currentDate);
        
        for (SkillTarget target : expiredTargets) {
            target.setStatus("EXPIRED");
            target.setUpdatedAt(LocalDateTime.now());
            skillTargetRepository.save(target);
            
            // Send notification
            String message = "Your skill target for " + target.getSkillName() + 
                    " at " + target.getTargetLevel() + " level has expired.";
            
            notificationService.createNotification(
                    target.getUserId(),
                    "Skill Target Expired",
                    message,
                    "/skill-targets/" + target.getId()
            );
        }
        
        log.info("Updated {} expired skill targets", expiredTargets.size());
    }
    
    /**
     * Get skill targets by date range
     */
    public List<SkillTargetDto> getTargetsInDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        List<SkillTarget> targets = skillTargetRepository.findTargetsInDateRange(userId, startDate, endDate);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return targets.stream()
                .map(target -> mapToDto(target, user))
                .collect(Collectors.toList());
    }
    
    /**
     * Map entity to DTO
     */
    private SkillTargetDto mapToDto(SkillTarget skillTarget, User user) {
        SkillTargetDto dto = new SkillTargetDto();
        dto.setId(skillTarget.getId());
        dto.setUserId(skillTarget.getUserId());
        dto.setSkillId(skillTarget.getSkillId());
        dto.setSkillName(skillTarget.getSkillName());
        dto.setSkillCategory(skillTarget.getSkillCategory());
        dto.setCurrentLevel(skillTarget.getCurrentLevel());
        dto.setTargetLevel(skillTarget.getTargetLevel());
        dto.setTargetDate(skillTarget.getTargetDate());
        dto.setStatus(skillTarget.getStatus());
        dto.setProgressNotes(skillTarget.getProgressNotes());
        dto.setResources(skillTarget.getResources());
        dto.setCreatedAt(skillTarget.getCreatedAt());
        dto.setUpdatedAt(skillTarget.getUpdatedAt());
        
        // Set additional fields if user is available
        if (user != null) {
            dto.setUserName(user.getFirstName() + " " + user.getLastName());
        }
        
        // Set skill description if skill ID is available
        if (skillTarget.getSkillId() != null) {
            skillRepository.findById(skillTarget.getSkillId())
                    .ifPresent(skill -> dto.setSkillDescription(skill.getDescription()));
        }
        
        return dto;
    }
    
    /**
     * Map DTO to entity
     */
    private SkillTarget mapToEntity(SkillTargetDto dto) {
        SkillTarget entity = new SkillTarget();
        entity.setId(dto.getId());
        entity.setUserId(dto.getUserId());
        entity.setSkillId(dto.getSkillId());
        entity.setSkillName(dto.getSkillName());
        entity.setSkillCategory(dto.getSkillCategory());
        entity.setCurrentLevel(dto.getCurrentLevel());
        entity.setTargetLevel(dto.getTargetLevel());
        entity.setTargetDate(dto.getTargetDate());
        entity.setStatus(dto.getStatus());
        entity.setProgressNotes(dto.getProgressNotes());
        entity.setResources(dto.getResources());
        
        return entity;
    }
}