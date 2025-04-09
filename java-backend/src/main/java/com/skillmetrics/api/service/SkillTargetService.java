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
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillTargetService {
    
    private final SkillTargetRepository skillTargetRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final NotificationService notificationService;
    
    @Transactional(readOnly = true)
    public List<SkillTargetDto> getAllSkillTargets() {
        return skillTargetRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public SkillTargetDto getSkillTargetById(Long id) {
        SkillTarget skillTarget = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        return convertToDto(skillTarget);
    }
    
    @Transactional(readOnly = true)
    public List<SkillTargetDto> getSkillTargetsByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return skillTargetRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillTargetDto> getSkillTargetsByUserIdAndStatus(Long userId, String status) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return skillTargetRepository.findByUserIdAndStatus(userId, status).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillTargetDto> getUpcomingSkillTargets(int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        
        return skillTargetRepository.findUpcomingTargets(targetDate).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillTargetDto> getNearCompletionTargets() {
        return skillTargetRepository.findNearCompletionTargets().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillTargetDto createSkillTarget(SkillTargetDto skillTargetDto, Long currentUserId) {
        User user = userRepository.findById(skillTargetDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + skillTargetDto.getUserId()));
        
        User createdBy = null;
        if (currentUserId != null) {
            createdBy = userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("Created by user not found with id: " + currentUserId));
        }
        
        Skill skill = null;
        if (skillTargetDto.getSkillId() != null) {
            skill = skillRepository.findById(skillTargetDto.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillTargetDto.getSkillId()));
        }
        
        SkillTarget skillTarget = new SkillTarget();
        skillTarget.setUser(user);
        skillTarget.setSkillName(skillTargetDto.getSkillName());
        skillTarget.setCategory(skillTargetDto.getCategory());
        skillTarget.setCurrentLevel(skillTargetDto.getCurrentLevel());
        skillTarget.setTargetLevel(skillTargetDto.getTargetLevel());
        skillTarget.setTargetDate(skillTargetDto.getTargetDate());
        skillTarget.setDescription(skillTargetDto.getDescription());
        skillTarget.setResources(skillTargetDto.getResources());
        skillTarget.setStatus("IN_PROGRESS"); // Default status for new targets
        skillTarget.setCreatedBy(createdBy);
        skillTarget.setCreatedAt(LocalDateTime.now());
        skillTarget.setSkill(skill);
        skillTarget.setProgress(0); // Start with 0% progress
        
        SkillTarget savedSkillTarget = skillTargetRepository.save(skillTarget);
        
        // Notify the user of the new skill target
        notificationService.createNotification(
                user.getId(),
                "New skill development target created: " + skillTarget.getSkillName() + " - Target level: " + skillTarget.getTargetLevel(),
                "/skill-targets/" + savedSkillTarget.getId(),
                "skill_target"
        );
        
        return convertToDto(savedSkillTarget);
    }
    
    @Transactional
    public SkillTargetDto updateSkillTarget(Long id, SkillTargetDto skillTargetDto) {
        SkillTarget skillTarget = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        // Check if status is changing to COMPLETED
        boolean isCompleting = "COMPLETED".equals(skillTargetDto.getStatus()) && !"COMPLETED".equals(skillTarget.getStatus());
        
        skillTarget.setSkillName(skillTargetDto.getSkillName());
        skillTarget.setCategory(skillTargetDto.getCategory());
        skillTarget.setCurrentLevel(skillTargetDto.getCurrentLevel());
        skillTarget.setTargetLevel(skillTargetDto.getTargetLevel());
        skillTarget.setTargetDate(skillTargetDto.getTargetDate());
        skillTarget.setDescription(skillTargetDto.getDescription());
        skillTarget.setResources(skillTargetDto.getResources());
        skillTarget.setStatus(skillTargetDto.getStatus());
        skillTarget.setUpdatedAt(LocalDateTime.now());
        skillTarget.setProgress(skillTargetDto.getProgress());
        
        if (skillTargetDto.getSkillId() != null) {
            Skill skill = skillRepository.findById(skillTargetDto.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + skillTargetDto.getSkillId()));
            skillTarget.setSkill(skill);
        } else {
            skillTarget.setSkill(null);
        }
        
        // If target is being completed, set the completion date
        if (isCompleting) {
            skillTarget.setCompletedAt(LocalDateTime.now());
            
            // Notify user of target completion
            notificationService.createNotification(
                    skillTarget.getUser().getId(),
                    "Congratulations! You've completed your skill target for: " + skillTarget.getSkillName(),
                    "/skill-targets/" + skillTarget.getId(),
                    "skill_target_complete"
            );
            
            // If target has an associated skill, check if we should update the skill level
            if (skillTarget.getSkill() != null) {
                // We could implement automatic skill level upgrading here if desired
                // For now, just notify that this could be done
                notificationService.createNotification(
                        skillTarget.getUser().getId(),
                        "Consider updating your skill level for: " + skillTarget.getSkillName(),
                        "/skills/" + skillTarget.getSkill().getId(),
                        "skill_update_suggestion"
                );
            }
        }
        
        SkillTarget updatedSkillTarget = skillTargetRepository.save(skillTarget);
        return convertToDto(updatedSkillTarget);
    }
    
    @Transactional
    public SkillTargetDto updateSkillTargetProgress(Long id, Integer progress) {
        SkillTarget skillTarget = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        // Validate progress value
        if (progress < 0) {
            progress = 0;
        } else if (progress > 100) {
            progress = 100;
        }
        
        // Check if target is completed with this update
        boolean isCompleting = progress == 100 && !"COMPLETED".equals(skillTarget.getStatus());
        
        skillTarget.setProgress(progress);
        skillTarget.setUpdatedAt(LocalDateTime.now());
        
        // If progress is 100%, also mark as completed
        if (isCompleting) {
            skillTarget.setStatus("COMPLETED");
            skillTarget.setCompletedAt(LocalDateTime.now());
            
            // Notify user of target completion
            notificationService.createNotification(
                    skillTarget.getUser().getId(),
                    "Congratulations! You've completed your skill target for: " + skillTarget.getSkillName(),
                    "/skill-targets/" + skillTarget.getId(),
                    "skill_target_complete"
            );
        }
        
        SkillTarget updatedSkillTarget = skillTargetRepository.save(skillTarget);
        return convertToDto(updatedSkillTarget);
    }
    
    @Transactional
    public void deleteSkillTarget(Long id) {
        SkillTarget skillTarget = skillTargetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill target not found with id: " + id));
        
        skillTargetRepository.delete(skillTarget);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getUserSkillTargetsSummary(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        Map<String, Object> summary = new HashMap<>();
        
        List<SkillTarget> allTargets = skillTargetRepository.findByUserId(userId);
        List<SkillTarget> activeTargets = skillTargetRepository.findByUserIdAndStatus(userId, "IN_PROGRESS");
        List<SkillTarget> completedTargets = skillTargetRepository.findByUserIdAndStatus(userId, "COMPLETED");
        
        summary.put("userId", userId);
        summary.put("userName", user.getFirstName() + " " + user.getLastName());
        summary.put("totalTargets", allTargets.size());
        summary.put("activeTargets", activeTargets.size());
        summary.put("completedTargets", completedTargets.size());
        
        // Calculate overall progress across all active targets
        double avgProgress = 0;
        if (!activeTargets.isEmpty()) {
            avgProgress = activeTargets.stream()
                    .mapToInt(SkillTarget::getProgress)
                    .average()
                    .orElse(0);
        }
        summary.put("averageProgress", avgProgress);
        
        // Get upcoming targets (due in next 30 days)
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        List<SkillTarget> upcomingTargets = activeTargets.stream()
                .filter(target -> target.getTargetDate() != null && 
                        target.getTargetDate().isBefore(thirtyDaysFromNow) &&
                        target.getTargetDate().isAfter(LocalDate.now()))
                .collect(Collectors.toList());
        
        summary.put("upcomingTargets", upcomingTargets.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
        
        // Get most recent targets
        List<SkillTarget> recentTargets = allTargets.stream()
                .sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList());
        
        summary.put("recentTargets", recentTargets.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
        
        return summary;
    }
    
    // Helper methods for entity <-> DTO conversion
    
    private SkillTargetDto convertToDto(SkillTarget skillTarget) {
        SkillTargetDto dto = new SkillTargetDto();
        BeanUtils.copyProperties(skillTarget, dto);
        
        dto.setUserId(skillTarget.getUser().getId());
        dto.setUserName(skillTarget.getUser().getFirstName() + " " + skillTarget.getUser().getLastName());
        dto.setUserEmail(skillTarget.getUser().getEmail());
        
        if (skillTarget.getCreatedBy() != null) {
            dto.setCreatedById(skillTarget.getCreatedBy().getId());
            dto.setCreatedByName(skillTarget.getCreatedBy().getFirstName() + " " + skillTarget.getCreatedBy().getLastName());
        }
        
        if (skillTarget.getSkill() != null) {
            dto.setSkillId(skillTarget.getSkill().getId());
        }
        
        return dto;
    }
}