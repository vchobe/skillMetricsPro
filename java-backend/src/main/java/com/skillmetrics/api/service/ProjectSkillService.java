package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.ProjectSkill;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ProjectSkillRepository;
import com.skillmetrics.api.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectSkillService {

    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public ProjectSkillDto getProjectSkillById(Long id) {
        ProjectSkill projectSkill = projectSkillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectSkill", "id", id));
        
        return mapToDto(projectSkill);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getSkillsByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        return projectSkillRepository.findByProjectId(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getProjectsBySkillId(Long skillId) {
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill", "id", skillId);
        }
        
        return projectSkillRepository.findBySkillId(skillId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectSkillDto addSkillToProject(ProjectSkillDto projectSkillDto) {
        Project project = projectRepository.findById(projectSkillDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectSkillDto.getProjectId()));
        
        Skill skill = skillRepository.findById(projectSkillDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", projectSkillDto.getSkillId()));
        
        // Check if this skill is already added to the project
        Optional<ProjectSkill> existingProjectSkill = 
                projectSkillRepository.findByProjectIdAndSkillId(projectSkillDto.getProjectId(), projectSkillDto.getSkillId());
        
        if (existingProjectSkill.isPresent()) {
            throw new IllegalStateException("This skill is already added to the project");
        }
        
        ProjectSkill projectSkill = new ProjectSkill();
        projectSkill.setProject(project);
        projectSkill.setSkill(skill);
        projectSkill.setRequiredLevel(projectSkillDto.getRequiredLevel());
        
        ProjectSkill savedProjectSkill = projectSkillRepository.save(projectSkill);
        
        return mapToDto(savedProjectSkill);
    }
    
    @Transactional
    public ProjectSkillDto updateProjectSkill(Long id, ProjectSkillDto projectSkillDto) {
        ProjectSkill projectSkill = projectSkillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectSkill", "id", id));
        
        // Update required level
        projectSkill.setRequiredLevel(projectSkillDto.getRequiredLevel());
        
        ProjectSkill updatedProjectSkill = projectSkillRepository.save(projectSkill);
        
        return mapToDto(updatedProjectSkill);
    }
    
    @Transactional
    public void removeSkillFromProject(Long id) {
        if (!projectSkillRepository.existsById(id)) {
            throw new ResourceNotFoundException("ProjectSkill", "id", id);
        }
        
        projectSkillRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getProjectSkillsByRequiredLevel(String requiredLevel) {
        return projectSkillRepository.findByRequiredLevel(requiredLevel).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    // Helper method to map ProjectSkill entity to ProjectSkillDto
    private ProjectSkillDto mapToDto(ProjectSkill projectSkill) {
        ProjectSkillDto projectSkillDto = new ProjectSkillDto();
        projectSkillDto.setId(projectSkill.getId());
        projectSkillDto.setProjectId(projectSkill.getProject().getId());
        projectSkillDto.setProjectName(projectSkill.getProject().getName());
        projectSkillDto.setSkillId(projectSkill.getSkill().getId());
        projectSkillDto.setSkillName(projectSkill.getSkill().getName());
        projectSkillDto.setCategory(projectSkill.getSkill().getCategory());
        projectSkillDto.setRequiredLevel(projectSkill.getRequiredLevel());
        projectSkillDto.setCreatedAt(projectSkill.getCreatedAt());
        projectSkillDto.setUpdatedAt(projectSkill.getUpdatedAt());
        
        return projectSkillDto;
    }
}
