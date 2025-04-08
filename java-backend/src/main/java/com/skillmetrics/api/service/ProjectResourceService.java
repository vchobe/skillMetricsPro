package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.ProjectResource;
import com.skillmetrics.api.model.ResourceHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ProjectResourceRepository;
import com.skillmetrics.api.repository.ResourceHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectResourceService {
    
    private final ProjectResourceRepository projectResourceRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ResourceHistoryRepository resourceHistoryRepository;
    
    public List<ProjectResourceDto> getAllProjectResources() {
        return projectResourceRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectResourceDto getProjectResourceById(Long id) {
        return projectResourceRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("Project resource not found with id " + id));
    }
    
    public List<ProjectResourceDto> getResourcesByProjectId(Long projectId) {
        return projectResourceRepository.findByProjectId(projectId).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public List<ProjectResourceDto> getResourcesByUserId(Long userId) {
        return projectResourceRepository.findByUserId(userId).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectResourceDto addResourceToProject(ProjectResourceDto resourceDto, Long performedById) {
        ProjectResource resource = convertToEntity(resourceDto);
        resource.setCreatedAt(LocalDateTime.now());
        
        ProjectResource savedResource = projectResourceRepository.save(resource);
        
        // Create history record for the addition
        ResourceHistory history = ResourceHistory.builder()
            .projectId(resource.getProjectId())
            .userId(resource.getUserId())
            .action("added")
            .newRole(resource.getRole())
            .newAllocation(resource.getAllocation())
            .date(LocalDateTime.now())
            .performedById(performedById)
            .note("Resource added to project")
            .build();
        
        resourceHistoryRepository.save(history);
        
        return convertToDto(savedResource);
    }
    
    @Transactional
    public ProjectResourceDto updateProjectResource(Long id, ProjectResourceDto resourceDto, Long performedById) {
        return projectResourceRepository.findById(id)
            .map(resource -> {
                // Store previous values for history
                String previousRole = resource.getRole();
                Integer previousAllocation = resource.getAllocation();
                
                // Update the resource
                resource.setRole(resourceDto.getRole());
                resource.setAllocation(resourceDto.getAllocation());
                resource.setStartDate(resourceDto.getStartDate());
                resource.setEndDate(resourceDto.getEndDate());
                resource.setNotes(resourceDto.getNotes());
                resource.setUpdatedAt(LocalDateTime.now());
                
                ProjectResource updatedResource = projectResourceRepository.save(resource);
                
                // Determine what changed and create history record
                if (!previousRole.equals(resource.getRole())) {
                    ResourceHistory history = ResourceHistory.builder()
                        .projectId(resource.getProjectId())
                        .userId(resource.getUserId())
                        .action("role_changed")
                        .previousRole(previousRole)
                        .newRole(resource.getRole())
                        .date(LocalDateTime.now())
                        .performedById(performedById)
                        .build();
                    
                    resourceHistoryRepository.save(history);
                }
                
                if (!previousAllocation.equals(resource.getAllocation())) {
                    ResourceHistory history = ResourceHistory.builder()
                        .projectId(resource.getProjectId())
                        .userId(resource.getUserId())
                        .action("allocation_changed")
                        .previousAllocation(previousAllocation)
                        .newAllocation(resource.getAllocation())
                        .date(LocalDateTime.now())
                        .performedById(performedById)
                        .build();
                    
                    resourceHistoryRepository.save(history);
                }
                
                return convertToDto(updatedResource);
            })
            .orElseThrow(() -> new RuntimeException("Project resource not found with id " + id));
    }
    
    @Transactional
    public void removeResourceFromProject(Long id, Long performedById, String note) {
        projectResourceRepository.findById(id).ifPresent(resource -> {
            // Create history record for removal
            ResourceHistory history = ResourceHistory.builder()
                .projectId(resource.getProjectId())
                .userId(resource.getUserId())
                .action("removed")
                .previousRole(resource.getRole())
                .previousAllocation(resource.getAllocation())
                .date(LocalDateTime.now())
                .performedById(performedById)
                .note(note)
                .build();
            
            resourceHistoryRepository.save(history);
            
            // Delete the resource
            projectResourceRepository.deleteById(id);
        });
    }
    
    public List<ResourceHistory> getResourceHistoryByProjectId(Long projectId) {
        return resourceHistoryRepository.findByProjectId(projectId);
    }
    
    private ProjectResourceDto convertToDto(ProjectResource resource) {
        ProjectResourceDto dto = ProjectResourceDto.builder()
            .id(resource.getId())
            .projectId(resource.getProjectId())
            .userId(resource.getUserId())
            .role(resource.getRole())
            .allocation(resource.getAllocation())
            .startDate(resource.getStartDate())
            .endDate(resource.getEndDate())
            .notes(resource.getNotes())
            .createdAt(resource.getCreatedAt())
            .updatedAt(resource.getUpdatedAt())
            .build();
        
        // Add derived fields from related entities
        Optional<Project> project = projectRepository.findById(resource.getProjectId());
        project.ifPresent(p -> dto.setProjectName(p.getName()));
        
        Optional<User> user = userRepository.findById(resource.getUserId());
        if (user.isPresent()) {
            User u = user.get();
            dto.setUserName(u.getFirstName() + " " + u.getLastName());
            dto.setUserEmail(u.getEmail());
        }
        
        return dto;
    }
    
    private ProjectResource convertToEntity(ProjectResourceDto dto) {
        return ProjectResource.builder()
            .id(dto.getId())
            .projectId(dto.getProjectId())
            .userId(dto.getUserId())
            .role(dto.getRole())
            .allocation(dto.getAllocation())
            .startDate(dto.getStartDate())
            .endDate(dto.getEndDate())
            .notes(dto.getNotes())
            .createdAt(dto.getCreatedAt())
            .updatedAt(dto.getUpdatedAt())
            .build();
    }
}
