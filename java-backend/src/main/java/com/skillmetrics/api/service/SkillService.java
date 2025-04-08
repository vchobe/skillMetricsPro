package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SkillService {
    
    private final SkillRepository skillRepository;
    
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public SkillDto getSkillById(Long id) {
        return skillRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("Skill not found with id " + id));
    }
    
    public List<SkillDto> getSkillsByUserId(Long userId) {
        return skillRepository.findByUserId(userId).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public SkillDto createSkill(SkillDto skillDto) {
        Skill skill = convertToEntity(skillDto);
        skill.setCreatedAt(LocalDateTime.now());
        skill = skillRepository.save(skill);
        return convertToDto(skill);
    }
    
    public SkillDto updateSkill(Long id, SkillDto skillDto) {
        return skillRepository.findById(id)
            .map(skill -> {
                skill.setName(skillDto.getName());
                skill.setCategory(skillDto.getCategory());
                skill.setLevel(skillDto.getLevel());
                skill.setDescription(skillDto.getDescription());
                skill.setCertification(skillDto.getCertification());
                skill.setCredlyLink(skillDto.getCredlyLink());
                skill.setUpdatedAt(LocalDateTime.now());
                return convertToDto(skillRepository.save(skill));
            })
            .orElseThrow(() -> new RuntimeException("Skill not found with id " + id));
    }
    
    public void deleteSkill(Long id) {
        skillRepository.deleteById(id);
    }
    
    private SkillDto convertToDto(Skill skill) {
        return SkillDto.builder()
            .id(skill.getId())
            .userId(skill.getUserId())
            .name(skill.getName())
            .category(skill.getCategory())
            .level(skill.getLevel())
            .description(skill.getDescription())
            .certification(skill.getCertification())
            .credlyLink(skill.getCredlyLink())
            .createdAt(skill.getCreatedAt())
            .updatedAt(skill.getUpdatedAt())
            .build();
    }
    
    private Skill convertToEntity(SkillDto skillDto) {
        return Skill.builder()
            .id(skillDto.getId())
            .userId(skillDto.getUserId())
            .name(skillDto.getName())
            .category(skillDto.getCategory())
            .level(skillDto.getLevel())
            .description(skillDto.getDescription())
            .certification(skillDto.getCertification())
            .credlyLink(skillDto.getCredlyLink())
            .createdAt(skillDto.getCreatedAt())
            .updatedAt(skillDto.getUpdatedAt())
            .build();
    }
}
