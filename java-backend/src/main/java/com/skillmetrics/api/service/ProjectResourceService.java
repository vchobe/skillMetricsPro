package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.ProjectResource;
import com.skillmetrics.api.model.ResourceHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ProjectResourceRepository;
import com.skillmetrics.api.repository.ResourceHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
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

    @Transactional(readOnly = true)
    public ProjectResourceDto getResourceById(Long id) {
        ProjectResource resource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        return mapToDto(resource);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        return projectResourceRepository.findByProjectId(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return projectResourceRepository.findByUserId(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectResourceDto addResourceToProject(ProjectResourceDto resourceDto) {
        Project project = projectRepository.findById(resourceDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", resourceDto.getProjectId()));
        
        User user = userRepository.findById(resourceDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", resourceDto.getUserId()));
        
        // Check if the user is already assigned to this project
        Optional<ProjectResource> existingResource = 
                projectResourceRepository.findByProjectIdAndUserId(resourceDto.getProjectId(), resourceDto.getUserId());
        
        if (existingResource.isPresent()) {
            throw new IllegalStateException("User is already assigned to this project");
        }
        
        ProjectResource projectResource = new ProjectResource();
        projectResource.setProject(project);
        projectResource.setUser(user);
        projectResource.setRole(resourceDto.getRole());
        projectResource.setAllocation(resourceDto.getAllocation());
        projectResource.setStartDate(resourceDto.getStartDate());
        projectResource.setEndDate(resourceDto.getEndDate());
        projectResource.setNotes(resourceDto.getNotes());
        
        ProjectResource savedResource = projectResourceRepository.save(projectResource);
        
        // Record this action in the resource history
        recordResourceHistory(project, user, "added", null, resourceDto.getRole(), 
                null, resourceDto.getAllocation(), resourceDto.getNotes());
        
        return mapToDto(savedResource);
    }
    
    @Transactional
    public ProjectResourceDto updateProjectResource(Long id, ProjectResourceDto resourceDto) {
        ProjectResource resource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        String previousRole = resource.getRole();
        Integer previousAllocation = resource.getAllocation();
        String action = null;
        
        // Check if role has changed
        if (!resource.getRole().equals(resourceDto.getRole())) {
            action = "role_changed";
        }
        // Check if allocation has changed
        else if (resource.getAllocation() != resourceDto.getAllocation()) {
            action = "allocation_changed";
        }
        
        // Update resource properties
        resource.setRole(resourceDto.getRole());
        resource.setAllocation(resourceDto.getAllocation());
        resource.setStartDate(resourceDto.getStartDate());
        resource.setEndDate(resourceDto.getEndDate());
        resource.setNotes(resourceDto.getNotes());
        
        ProjectResource updatedResource = projectResourceRepository.save(resource);
        
        // Record this action in resource history if role or allocation changed
        if (action != null) {
            recordResourceHistory(
                resource.getProject(), 
                resource.getUser(), 
                action, 
                previousRole, 
                resourceDto.getRole(),
                previousAllocation, 
                resourceDto.getAllocation(), 
                resourceDto.getNotes()
            );
        }
        
        return mapToDto(updatedResource);
    }
    
    @Transactional
    public void removeResourceFromProject(Long id) {
        ProjectResource resource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        Project project = resource.getProject();
        User user = resource.getUser();
        String previousRole = resource.getRole();
        Integer previousAllocation = resource.getAllocation();
        
        // Record this action in resource history before deleting
        recordResourceHistory(
            project, 
            user, 
            "removed", 
            previousRole, 
            null,
            previousAllocation, 
            null, 
            "Resource removed from project"
        );
        
        projectResourceRepository.deleteById(id);
    }
    
    // Helper method to record resource history
    private void recordResourceHistory(
            Project project, 
            User user, 
            String action, 
            String previousRole, 
            String newRole,
            Integer previousAllocation, 
            Integer newAllocation, 
            String note) {
        
        // Get current user as the one who performed this action
        String currentUsername = getCurrentUsername();
        User performedBy = null;
        if (currentUsername != null) {
            performedBy = userRepository.findByUsername(currentUsername).orElse(null);
        }
        
        ResourceHistory history = new ResourceHistory();
        history.setProject(project);
        history.setUser(user);
        history.setAction(action);
        history.setPreviousRole(previousRole);
        history.setNewRole(newRole);
        history.setPreviousAllocation(previousAllocation);
        history.setNewAllocation(newAllocation);
        history.setDate(LocalDateTime.now());
        history.setPerformedBy(performedBy);
        history.setNote(note);
        
        resourceHistoryRepository.save(history);
    }
    
    // Helper method to get current username
    private String getCurrentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        }
        return null;
    }
    
    // Helper method to map ProjectResource entity to ProjectResourceDto
    private ProjectResourceDto mapToDto(ProjectResource resource) {
        ProjectResourceDto resourceDto = new ProjectResourceDto();
        resourceDto.setId(resource.getId());
        resourceDto.setProjectId(resource.getProject().getId());
        resourceDto.setProjectName(resource.getProject().getName());
        resourceDto.setUserId(resource.getUser().getId());
        
        // Combine first and last name if available, otherwise use username
        String userName = resource.getUser().getUsername();
        if (resource.getUser().getFirstName() != null && resource.getUser().getLastName() != null) {
            userName = resource.getUser().getFirstName() + " " + resource.getUser().getLastName();
        }
        resourceDto.setUserName(userName);
        
        resourceDto.setRole(resource.getRole());
        resourceDto.setAllocation(resource.getAllocation());
        resourceDto.setStartDate(resource.getStartDate());
        resourceDto.setEndDate(resource.getEndDate());
        resourceDto.setNotes(resource.getNotes());
        resourceDto.setCreatedAt(resource.getCreatedAt());
        resourceDto.setUpdatedAt(resource.getUpdatedAt());
        
        return resourceDto;
    }
}
