package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.repository.SkillHistoryRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillHistoryService {

    private final SkillHistoryRepository skillHistoryRepository;
    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryBySkillId(Long skillId) {
        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + skillId));
        
        return skillHistoryRepository.findBySkillId(skillId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillHistoryDto> getHistoryByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        
        return skillHistoryRepository.findBySkillUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Helper methods
    
    private SkillHistoryDto convertToDto(SkillHistory history) {
        return SkillHistoryDto.builder()
                .id(history.getId())
                .skillId(history.getSkill().getId())
                .skillName(history.getSkill().getName())
                .userId(history.getSkill().getUser().getId())
                .username(history.getSkill().getUser().getUsername())
                .action(history.getAction())
                .previousLevel(history.getPreviousLevel())
                .newLevel(history.getNewLevel())
                .notes(history.getNotes())
                .timestamp(history.getTimestamp())
                .build();
    }
}
