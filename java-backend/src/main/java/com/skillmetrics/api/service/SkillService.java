package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public SkillDto getSkillById(Long id) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        return mapToDto(skill);
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return skillRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public SkillDto createSkill(SkillDto skillDto) {
        User user = userRepository.findById(skillDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", skillDto.getUserId()));
        
        Skill skill = new Skill();
        skill.setUser(user);
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        
        Skill savedSkill = skillRepository.save(skill);
        
        return mapToDto(savedSkill);
    }
    
    @Transactional
    public SkillDto updateSkill(Long id, SkillDto skillDto) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", id));
        
        // Update skill properties
        skill.setName(skillDto.getName());
        skill.setCategory(skillDto.getCategory());
        skill.setLevel(skillDto.getLevel());
        skill.setDescription(skillDto.getDescription());
        skill.setCertification(skillDto.getCertification());
        skill.setCredlyLink(skillDto.getCredlyLink());
        
        Skill updatedSkill = skillRepository.save(skill);
        
        return mapToDto(updatedSkill);
    }
    
    @Transactional
    public void deleteSkill(Long id) {
        if (!skillRepository.existsById(id)) {
            throw new ResourceNotFoundException("Skill", "id", id);
        }
        
        skillRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByCategory(String category) {
        return skillRepository.findByCategory(category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> getSkillsByLevel(String level) {
        return skillRepository.findByLevel(level).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> searchSkillsByName(String keyword) {
        return skillRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    // Helper method to map Skill entity to SkillDto
    private SkillDto mapToDto(Skill skill) {
        SkillDto skillDto = new SkillDto();
        skillDto.setId(skill.getId());
        skillDto.setUserId(skill.getUser().getId());
        skillDto.setName(skill.getName());
        skillDto.setCategory(skill.getCategory());
        skillDto.setLevel(skill.getLevel());
        skillDto.setDescription(skill.getDescription());
        skillDto.setCertification(skill.getCertification());
        skillDto.setCredlyLink(skill.getCredlyLink());
        skillDto.setCreatedAt(skill.getCreatedAt());
        skillDto.setUpdatedAt(skill.getUpdatedAt());
        
        return skillDto;
    }
}
