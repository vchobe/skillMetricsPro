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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    public List<ProjectResourceDto> getAllProjectResources() {
        return projectResourceRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ProjectResourceDto getProjectResourceById(Long id) {
        ProjectResource projectResource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        return mapToDto(projectResource);
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
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByProjectIdAndUserId(Long projectId, Long userId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return projectResourceRepository.findByProjectIdAndUserId(projectId, userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByRole(String role) {
        return projectResourceRepository.findByRole(role).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByProjectIdAndRole(Long projectId, String role) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        return projectResourceRepository.findByProjectIdAndRole(projectId, role).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesStartingAfter(LocalDate date) {
        return projectResourceRepository.findByStartDateAfter(date).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesEndingBefore(LocalDate date) {
        return projectResourceRepository.findByEndDateBefore(date).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getActiveResourcesAtDate(LocalDate date) {
        return projectResourceRepository.findByStartDateBeforeAndEndDateAfterOrEndDateIsNull(date, date).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByUserIdAndMinimumAllocation(Long userId, Integer minimumAllocation) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return projectResourceRepository.findByUserIdAndMinimumAllocation(userId, minimumAllocation).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> searchResourcesByProjectName(String keyword) {
        return projectResourceRepository.findByProjectNameContaining(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> searchResourcesByUserName(String keyword) {
        return projectResourceRepository.findByUserNameContaining(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectResourceDto createProjectResource(ProjectResourceDto projectResourceDto) {
        Project project = projectRepository.findById(projectResourceDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectResourceDto.getProjectId()));
        
        User user = userRepository.findById(projectResourceDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectResourceDto.getUserId()));
        
        ProjectResource projectResource = new ProjectResource();
        projectResource.setProject(project);
        projectResource.setUser(user);
        projectResource.setRole(projectResourceDto.getRole());
        projectResource.setAllocation(projectResourceDto.getAllocation());
        projectResource.setStartDate(projectResourceDto.getStartDate());
        projectResource.setEndDate(projectResourceDto.getEndDate());
        projectResource.setNotes(projectResourceDto.getNotes());
        
        ProjectResource savedProjectResource = projectResourceRepository.save(projectResource);
        
        // Create history record for resource addition
        createResourceHistoryRecord(
            savedProjectResource.getProject().getId(),
            savedProjectResource.getUser().getId(),
            "added",
            null,
            savedProjectResource.getRole(),
            null,
            savedProjectResource.getAllocation()
        );
        
        return mapToDto(savedProjectResource);
    }
    
    @Transactional
    public ProjectResourceDto updateProjectResource(Long id, ProjectResourceDto projectResourceDto) {
        ProjectResource projectResource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        // Store previous values for history tracking
        String previousRole = projectResource.getRole();
        Integer previousAllocation = projectResource.getAllocation();
        
        // Only set project and user if they are changing to minimize DB calls
        if (projectResourceDto.getProjectId() != null && 
                !projectResource.getProject().getId().equals(projectResourceDto.getProjectId())) {
            Project project = projectRepository.findById(projectResourceDto.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectResourceDto.getProjectId()));
            projectResource.setProject(project);
        }
        
        if (projectResourceDto.getUserId() != null && 
                !projectResource.getUser().getId().equals(projectResourceDto.getUserId())) {
            User user = userRepository.findById(projectResourceDto.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectResourceDto.getUserId()));
            projectResource.setUser(user);
        }
        
        projectResource.setRole(projectResourceDto.getRole());
        projectResource.setAllocation(projectResourceDto.getAllocation());
        projectResource.setStartDate(projectResourceDto.getStartDate());
        projectResource.setEndDate(projectResourceDto.getEndDate());
        projectResource.setNotes(projectResourceDto.getNotes());
        
        ProjectResource updatedProjectResource = projectResourceRepository.save(projectResource);
        
        // Create history records if role or allocation changed
        if (!previousRole.equals(updatedProjectResource.getRole())) {
            createResourceHistoryRecord(
                updatedProjectResource.getProject().getId(),
                updatedProjectResource.getUser().getId(),
                "role_changed",
                previousRole,
                updatedProjectResource.getRole(),
                null,
                null
            );
        }
        
        if (!previousAllocation.equals(updatedProjectResource.getAllocation())) {
            createResourceHistoryRecord(
                updatedProjectResource.getProject().getId(),
                updatedProjectResource.getUser().getId(),
                "allocation_changed",
                null,
                null,
                previousAllocation,
                updatedProjectResource.getAllocation()
            );
        }
        
        return mapToDto(updatedProjectResource);
    }
    
    @Transactional
    public void deleteProjectResource(Long id) {
        ProjectResource projectResource = projectResourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectResource", "id", id));
        
        // Save info before deleting for history record
        Long projectId = projectResource.getProject().getId();
        Long userId = projectResource.getUser().getId();
        String role = projectResource.getRole();
        
        projectResourceRepository.deleteById(id);
        
        // Create history record for removal
        createResourceHistoryRecord(
            projectId,
            userId,
            "removed",
            role,
            null,
            projectResource.getAllocation(),
            null
        );
    }
    
    // Helper method to create resource history records
    private void createResourceHistoryRecord(Long projectId, Long userId, String action, 
                                           String previousRole, String newRole,
                                           Integer previousAllocation, Integer newAllocation) {
        
        ResourceHistory history = new ResourceHistory();
        history.setProjectId(projectId);
        history.setUserId(userId);
        history.setAction(action);
        history.setPreviousRole(previousRole);
        history.setNewRole(newRole);
        history.setPreviousAllocation(previousAllocation);
        history.setNewAllocation(newAllocation);
        
        // Get current authenticated user as the performer
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            Optional<User> performedBy = userRepository.findByUsername(username);
            performedBy.ifPresent(user -> history.setPerformedById(user.getId()));
        }
        
        resourceHistoryRepository.save(history);
    }
    
    // Helper method to map ProjectResource entity to ProjectResourceDto
    private ProjectResourceDto mapToDto(ProjectResource projectResource) {
        ProjectResourceDto dto = new ProjectResourceDto();
        dto.setId(projectResource.getId());
        
        dto.setProjectId(projectResource.getProject().getId());
        dto.setProjectName(projectResource.getProject().getName());
        
        dto.setUserId(projectResource.getUser().getId());
        String userName = projectResource.getUser().getFirstName() + " " + projectResource.getUser().getLastName();
        dto.setUserName(userName.trim());
        
        dto.setRole(projectResource.getRole());
        dto.setAllocation(projectResource.getAllocation());
        dto.setStartDate(projectResource.getStartDate());
        dto.setEndDate(projectResource.getEndDate());
        dto.setNotes(projectResource.getNotes());
        dto.setCreatedAt(projectResource.getCreatedAt());
        dto.setUpdatedAt(projectResource.getUpdatedAt());
        
        return dto;
    }
}
