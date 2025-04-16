package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.exception.ResourceAlreadyExistsException;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectSkillService {

    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectRepository projectRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getAllProjectSkills() {
        return projectSkillRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
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
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getProjectSkillsByRequiredLevel(String requiredLevel) {
        return projectSkillRepository.findByRequiredLevel(requiredLevel).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getProjectSkillsBySkillCategory(String category) {
        return projectSkillRepository.findBySkillCategory(category).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> searchProjectSkillsByProjectName(String keyword) {
        return projectSkillRepository.findByProjectNameContaining(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> searchProjectSkillsBySkillName(String keyword) {
        return projectSkillRepository.findBySkillNameContaining(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectSkillDto createProjectSkill(ProjectSkillDto projectSkillDto) {
        Project project = projectRepository.findById(projectSkillDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectSkillDto.getProjectId()));
        
        Skill skill = skillRepository.findById(projectSkillDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", projectSkillDto.getSkillId()));
        
        // Check if the project skill already exists
        if (projectSkillRepository.existsByProjectIdAndSkillId(projectSkillDto.getProjectId(), projectSkillDto.getSkillId())) {
            throw new ResourceAlreadyExistsException("ProjectSkill", 
                "projectId and skillId", 
                projectSkillDto.getProjectId() + " and " + projectSkillDto.getSkillId());
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
        
        // Check if project and skill are changing and if they exist
        if (projectSkillDto.getProjectId() != null && 
                !projectSkill.getProject().getId().equals(projectSkillDto.getProjectId())) {
            
            Project project = projectRepository.findById(projectSkillDto.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectSkillDto.getProjectId()));
            
            // Check if the new project-skill combination already exists
            if (projectSkillRepository.existsByProjectIdAndSkillId(
                    projectSkillDto.getProjectId(), projectSkill.getSkill().getId())) {
                throw new ResourceAlreadyExistsException("ProjectSkill", 
                    "projectId and skillId", 
                    projectSkillDto.getProjectId() + " and " + projectSkill.getSkill().getId());
            }
            
            projectSkill.setProject(project);
        }
        
        if (projectSkillDto.getSkillId() != null && 
                !projectSkill.getSkill().getId().equals(projectSkillDto.getSkillId())) {
            
            Skill skill = skillRepository.findById(projectSkillDto.getSkillId())
                    .orElseThrow(() -> new ResourceNotFoundException("Skill", "id", projectSkillDto.getSkillId()));
            
            // Check if the new project-skill combination already exists
            if (projectSkillRepository.existsByProjectIdAndSkillId(
                    projectSkill.getProject().getId(), projectSkillDto.getSkillId())) {
                throw new ResourceAlreadyExistsException("ProjectSkill", 
                    "projectId and skillId", 
                    projectSkill.getProject().getId() + " and " + projectSkillDto.getSkillId());
            }
            
            projectSkill.setSkill(skill);
        }
        
        projectSkill.setRequiredLevel(projectSkillDto.getRequiredLevel());
        
        ProjectSkill updatedProjectSkill = projectSkillRepository.save(projectSkill);
        
        return mapToDto(updatedProjectSkill);
    }
    
    @Transactional
    public void deleteProjectSkill(Long id) {
        if (!projectSkillRepository.existsById(id)) {
            throw new ResourceNotFoundException("ProjectSkill", "id", id);
        }
        
        projectSkillRepository.deleteById(id);
    }
    
    // Helper method to map ProjectSkill entity to ProjectSkillDto
    private ProjectSkillDto mapToDto(ProjectSkill projectSkill) {
        ProjectSkillDto dto = new ProjectSkillDto();
        dto.setId(projectSkill.getId());
        
        dto.setProjectId(projectSkill.getProject().getId());
        dto.setProjectName(projectSkill.getProject().getName());
        
        dto.setSkillId(projectSkill.getSkill().getId());
        dto.setSkillName(projectSkill.getSkill().getName());
        dto.setCategory(projectSkill.getSkill().getCategory());
        dto.setLevel(projectSkill.getSkill().getLevel());
        
        dto.setRequiredLevel(projectSkill.getRequiredLevel());
        dto.setCreatedAt(projectSkill.getCreatedAt());
        dto.setUpdatedAt(projectSkill.getUpdatedAt());
        
        return dto;
    }
}
