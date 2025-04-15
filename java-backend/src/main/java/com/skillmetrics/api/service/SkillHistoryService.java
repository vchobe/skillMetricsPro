package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillHistoryRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillHistoryService {

    private final SkillHistoryRepository skillHistoryRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryForSkill(Long skillId) {
        // Verify skill exists
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        List<SkillHistory> history = skillHistoryRepository.findBySkillIdOrderByCreatedAtDesc(skillId);
        
        return history.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryForUser(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        List<SkillHistory> history;
        
        if (startDate != null && endDate != null) {
            history = skillHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    userId, startDate, endDate);
        } else {
            history = skillHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        return history.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryByField(String field, LocalDateTime startDate, LocalDateTime endDate) {
        List<SkillHistory> history;
        
        if (startDate != null && endDate != null) {
            history = skillHistoryRepository.findByFieldAndCreatedAtBetweenOrderByCreatedAtDesc(
                    field, startDate, endDate);
        } else {
            history = skillHistoryRepository.findByFieldOrderByCreatedAtDesc(field);
        }
        
        return history.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getRecentHistory(int limit) {
        List<SkillHistory> history = skillHistoryRepository.findTop20ByOrderByCreatedAtDesc();
        
        // Apply custom limit if different from default
        if (limit != 20 && history.size() > limit) {
            history = history.subList(0, limit);
        }
        
        return history.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    /**
     * Create a new skill history entry
     */
    @Transactional
    public SkillHistory createSkillHistory(Skill skill, String action, String field, String oldValue, 
                                          String newValue, Long changedBy, String changeReason, User performedBy) {
        SkillHistory history = new SkillHistory();
        history.setSkill(skill);
        history.setUser(skill.getUser());
        history.setAction(action);
        history.setField(field);
        history.setOldValue(oldValue);
        history.setNewValue(newValue);
        history.setChangedBy(changedBy);
        history.setChangeReason(changeReason);
        history.setPerformedBy(performedBy);
        history.setTimestamp(LocalDateTime.now());
        
        return skillHistoryRepository.save(history);
    }
    
    // Helper method to convert entity to DTO
    private SkillHistoryDto convertToDto(SkillHistory history) {
        SkillHistoryDto dto = new SkillHistoryDto();
        dto.setId(history.getId());
        dto.setSkillId(history.getSkillId());
        dto.setUserId(history.getUserId());
        dto.setField(history.getField());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setChangedBy(history.getChangedBy());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }
}