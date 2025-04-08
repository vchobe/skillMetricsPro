package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.model.enums.SkillLevel;
import com.skillmetrics.api.repository.SkillHistoryRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        return skillHistoryRepository.findBySkillIdOrderByTimestampDesc(skillId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return skillHistoryRepository.findByUserIdOrderByTimestampDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryByAction(Long userId, String action) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return skillHistoryRepository.findByUserIdAndActionOrderByTimestampDesc(userId, action).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getRecentHistory(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        return skillHistoryRepository.findByTimestampAfter(since).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillHistoryDto createSkillHistory(
            Skill skill, 
            String action, 
            SkillLevel previousLevel,
            SkillLevel newLevel,
            String previousCategory,
            String newCategory,
            String notes,
            User performedBy) {
        
        SkillHistory history = new SkillHistory();
        history.setSkill(skill);
        history.setAction(action);
        history.setPreviousLevel(previousLevel);
        history.setNewLevel(newLevel);
        history.setPreviousCategory(previousCategory);
        history.setNewCategory(newCategory);
        history.setNotes(notes);
        
        // If performedBy is null, get the current authenticated user
        if (performedBy == null) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            performedBy = userRepository.findByUsername(username)
                    .orElse(null); // Allow null for system actions
        }
        
        history.setPerformedBy(performedBy);
        
        SkillHistory savedHistory = skillHistoryRepository.save(history);
        
        return mapToDto(savedHistory);
    }
    
    // Helper method to map SkillHistory entity to SkillHistoryDto
    private SkillHistoryDto mapToDto(SkillHistory history) {
        SkillHistoryDto dto = new SkillHistoryDto();
        dto.setId(history.getId());
        dto.setSkillId(history.getSkill().getId());
        dto.setSkillName(history.getSkill().getName());
        dto.setUserId(history.getSkill().getUser().getId());
        
        String userName = history.getSkill().getUser().getFirstName() + " " + 
                         history.getSkill().getUser().getLastName();
        dto.setUserName(userName.trim());
        
        dto.setAction(history.getAction());
        dto.setPreviousLevel(history.getPreviousLevel());
        dto.setNewLevel(history.getNewLevel());
        dto.setPreviousCategory(history.getPreviousCategory());
        dto.setNewCategory(history.getNewCategory());
        dto.setNotes(history.getNotes());
        
        if (history.getPerformedBy() != null) {
            dto.setPerformedById(history.getPerformedBy().getId());
            
            String performedByName = history.getPerformedBy().getFirstName() + " " + 
                                   history.getPerformedBy().getLastName();
            dto.setPerformedByName(performedByName.trim());
        }
        
        dto.setTimestamp(history.getTimestamp());
        
        return dto;
    }
}
