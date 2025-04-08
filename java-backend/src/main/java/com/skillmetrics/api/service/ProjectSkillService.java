package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.ProjectSkill;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ProjectSkillRepository;
import com.skillmetrics.api.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectSkillService {
    
    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;
    
    public List<ProjectSkillDto> getAllProjectSkills() {
        return projectSkillRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectSkillDto getProjectSkillById(Long id) {
        return projectSkillRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("Project skill not found with id " + id));
    }
    
    public List<ProjectSkillDto> getSkillsByProjectId(Long projectId) {
        List<ProjectSkill> projectSkills = projectSkillRepository.findByProjectIdWithSkillDetails(projectId);
        return projectSkills.stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectSkillDto addSkillToProject(ProjectSkillDto projectSkillDto) {
        ProjectSkill projectSkill = convertToEntity(projectSkillDto);
        projectSkill.setCreatedAt(LocalDateTime.now());
        projectSkill = projectSkillRepository.save(projectSkill);
        return convertToDto(projectSkill);
    }
    
    public ProjectSkillDto updateProjectSkill(Long id, ProjectSkillDto projectSkillDto) {
        return projectSkillRepository.findById(id)
            .map(projectSkill -> {
                projectSkill.setRequiredLevel(projectSkillDto.getRequiredLevel());
                projectSkill.setUpdatedAt(LocalDateTime.now());
                return convertToDto(projectSkillRepository.save(projectSkill));
            })
            .orElseThrow(() -> new RuntimeException("Project skill not found with id " + id));
    }
    
    @Transactional
    public void removeSkillFromProject(Long projectId, Long skillId) {
        projectSkillRepository.deleteByProjectIdAndSkillId(projectId, skillId);
    }
    
    @Transactional
    public void deleteProjectSkill(Long id) {
        projectSkillRepository.deleteById(id);
    }
    
    private ProjectSkillDto convertToDto(ProjectSkill projectSkill) {
        ProjectSkillDto dto = ProjectSkillDto.builder()
            .id(projectSkill.getId())
            .projectId(projectSkill.getProjectId())
            .skillId(projectSkill.getSkillId())
            .requiredLevel(projectSkill.getRequiredLevel())
            .createdAt(projectSkill.getCreatedAt())
            .updatedAt(projectSkill.getUpdatedAt())
            .build();
        
        // Add derived fields from related entities
        Optional<Project> project = projectRepository.findById(projectSkill.getProjectId());
        project.ifPresent(p -> dto.setProjectName(p.getName()));
        
        // If transient fields are set, use them
        if (projectSkill.getSkillName() != null) {
            dto.setSkillName(projectSkill.getSkillName());
            dto.setCategory(projectSkill.getCategory());
            dto.setLevel(projectSkill.getLevel());
        } else {
            // Otherwise, fetch from repository
            Optional<Skill> skill = skillRepository.findById(projectSkill.getSkillId());
            if (skill.isPresent()) {
                Skill s = skill.get();
                dto.setSkillName(s.getName());
                dto.setCategory(s.getCategory());
                dto.setLevel(s.getLevel());
            }
        }
        
        return dto;
    }
    
    private ProjectSkill convertToEntity(ProjectSkillDto dto) {
        return ProjectSkill.builder()
            .id(dto.getId())
            .projectId(dto.getProjectId())
            .skillId(dto.getSkillId())
            .requiredLevel(dto.getRequiredLevel())
            .createdAt(dto.getCreatedAt())
            .updatedAt(dto.getUpdatedAt())
            .build();
    }
}
