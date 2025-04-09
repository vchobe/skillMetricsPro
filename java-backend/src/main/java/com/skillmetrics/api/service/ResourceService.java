package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ResourceDto;
import com.skillmetrics.api.dto.ResourceHistoryDto;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ProjectResourceRepository resourceRepository;
    private final ResourceHistoryRepository historyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<ResourceDto> getResourcesByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return resourceRepository.findByProjectId(projectId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceDto> getResourcesByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return resourceRepository.findByUserId(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ResourceDto getResourceById(Long id) {
        ProjectResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id " + id));
        
        return convertToDto(resource);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceDto> getCurrentResourcesForUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return resourceRepository.findCurrentResourcesForUser(userId, LocalDate.now()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceDto> getCurrentResourcesForProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return resourceRepository.findCurrentResourcesForProject(projectId, LocalDate.now()).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Integer calculateUserTotalAllocation(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        Integer total = resourceRepository.calculateUserTotalAllocation(userId, LocalDate.now());
        return total != null ? total : 0;
    }
    
    @Transactional
    public ResourceDto addResourceToProject(ResourceDto resourceDto, Long performedById) {
        Project project = projectRepository.findById(resourceDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + resourceDto.getProjectId()));
        
        User user = userRepository.findById(resourceDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + resourceDto.getUserId()));
        
        User performedBy = userRepository.findById(performedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + performedById));
        
        // Check if user is already assigned to this project
        if (resourceRepository.findByProjectIdAndUserId(
                resourceDto.getProjectId(), resourceDto.getUserId()).isPresent()) {
            throw new IllegalStateException("User is already assigned to this project");
        }
        
        // Check total allocation
        Integer currentAllocation = resourceRepository.calculateUserTotalAllocation(
                resourceDto.getUserId(), LocalDate.now());
        if (currentAllocation != null && resourceDto.getAllocation() != null) {
            int newTotal = currentAllocation + resourceDto.getAllocation();
            if (newTotal > 100) {
                throw new IllegalStateException(
                        "User's total allocation would exceed 100%: current=" + currentAllocation + 
                        "%, new=" + resourceDto.getAllocation() + "%, total=" + newTotal + "%");
            }
        }
        
        ProjectResource resource = new ProjectResource();
        resource.setProject(project);
        resource.setUser(user);
        resource.setRole(resourceDto.getRole());
        resource.setAllocation(resourceDto.getAllocation());
        resource.setStartDate(resourceDto.getStartDate());
        resource.setEndDate(resourceDto.getEndDate());
        resource.setNotes(resourceDto.getNotes());
        
        ProjectResource savedResource = resourceRepository.save(resource);
        
        // Create resource history
        ResourceHistory history = new ResourceHistory();
        history.setProjectResource(savedResource);
        history.setProject(project);
        history.setUser(user);
        history.setAction("added");
        history.setNewRole(resourceDto.getRole());
        history.setNewAllocation(resourceDto.getAllocation());
        history.setPerformedBy(performedBy);
        history.setNote("Initial assignment to project");
        
        historyRepository.save(history);
        
        // Send notification to the user
        notificationService.createNotification(
                user.getId(),
                "You have been assigned to project: " + project.getName() + " as " + resourceDto.getRole(),
                "/projects/" + project.getId(),
                "project_assignment"
        );
        
        // Send email notification
        try {
            emailService.sendProjectAssignmentEmail(
                    user.getEmail(),
                    user.getFirstName() + " " + user.getLastName(),
                    project.getName(),
                    resourceDto.getRole(),
                    resourceDto.getAllocation() != null ? resourceDto.getAllocation() + "%" : "Not specified",
                    project.getLocation(),
                    resourceDto.getStartDate(),
                    resourceDto.getEndDate()
            );
        } catch (Exception e) {
            // Log exception but don't fail the assignment process
            System.err.println("Failed to send project assignment email: " + e.getMessage());
        }
        
        return convertToDto(savedResource);
    }
    
    @Transactional
    public ResourceDto updateResource(Long id, ResourceDto resourceDto, Long performedById) {
        ProjectResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id " + id));
        
        User performedBy = userRepository.findById(performedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + performedById));
        
        // Check total allocation if allocation changed
        if (resourceDto.getAllocation() != null && !resourceDto.getAllocation().equals(resource.getAllocation())) {
            Integer currentAllocation = resourceRepository.calculateUserTotalAllocation(
                    resource.getUser().getId(), LocalDate.now());
            if (currentAllocation != null) {
                // Subtract current resource allocation and add new allocation
                int currentWithoutThis = currentAllocation - (resource.getAllocation() != null ? resource.getAllocation() : 0);
                int newTotal = currentWithoutThis + resourceDto.getAllocation();
                if (newTotal > 100) {
                    throw new IllegalStateException(
                            "User's total allocation would exceed 100%: current=" + currentWithoutThis + 
                            "%, new=" + resourceDto.getAllocation() + "%, total=" + newTotal + "%");
                }
            }
        }
        
        // Create resource history for changes
        ResourceHistory history = new ResourceHistory();
        history.setProjectResource(resource);
        history.setProject(resource.getProject());
        history.setUser(resource.getUser());
        history.setPerformedBy(performedBy);
        
        boolean roleChanged = resourceDto.getRole() != null && !resourceDto.getRole().equals(resource.getRole());
        boolean allocationChanged = resourceDto.getAllocation() != null && !resourceDto.getAllocation().equals(resource.getAllocation());
        
        if (roleChanged && allocationChanged) {
            history.setAction("role_and_allocation_changed");
            history.setPreviousRole(resource.getRole());
            history.setNewRole(resourceDto.getRole());
            history.setPreviousAllocation(resource.getAllocation());
            history.setNewAllocation(resourceDto.getAllocation());
            history.setNote("Role and allocation updated");
        } else if (roleChanged) {
            history.setAction("role_changed");
            history.setPreviousRole(resource.getRole());
            history.setNewRole(resourceDto.getRole());
            history.setNote("Role updated");
        } else if (allocationChanged) {
            history.setAction("allocation_changed");
            history.setPreviousAllocation(resource.getAllocation());
            history.setNewAllocation(resourceDto.getAllocation());
            history.setNote("Allocation updated");
        } else {
            history.setAction("updated");
            history.setNote("Resource details updated");
        }
        
        // Update resource
        if (resourceDto.getRole() != null) {
            resource.setRole(resourceDto.getRole());
        }
        if (resourceDto.getAllocation() != null) {
            resource.setAllocation(resourceDto.getAllocation());
        }
        if (resourceDto.getStartDate() != null) {
            resource.setStartDate(resourceDto.getStartDate());
        }
        if (resourceDto.getEndDate() != null) {
            resource.setEndDate(resourceDto.getEndDate());
        }
        if (resourceDto.getNotes() != null) {
            resource.setNotes(resourceDto.getNotes());
        }
        
        ProjectResource updatedResource = resourceRepository.save(resource);
        historyRepository.save(history);
        
        // Send notification for significant changes
        if (roleChanged || allocationChanged) {
            notificationService.createNotification(
                    resource.getUser().getId(),
                    "Your role/allocation in project " + resource.getProject().getName() + " has been updated",
                    "/projects/" + resource.getProject().getId(),
                    "project_update"
            );
            
            // Send email notification for significant changes
            try {
                emailService.sendProjectUpdateEmail(
                        resource.getUser().getEmail(),
                        resource.getUser().getFirstName() + " " + resource.getUser().getLastName(),
                        resource.getProject().getName(),
                        roleChanged ? resource.getRole() : null,
                        roleChanged ? resourceDto.getRole() : null,
                        allocationChanged ? resource.getAllocation() : null,
                        allocationChanged ? resourceDto.getAllocation() : null
                );
            } catch (Exception e) {
                // Log exception but don't fail the update process
                System.err.println("Failed to send project update email: " + e.getMessage());
            }
        }
        
        return convertToDto(updatedResource);
    }
    
    @Transactional
    public void removeResource(Long id, Long performedById) {
        ProjectResource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id " + id));
        
        User performedBy = userRepository.findById(performedById)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + performedById));
        
        // Create resource history
        ResourceHistory history = new ResourceHistory();
        history.setProjectResource(resource);
        history.setProject(resource.getProject());
        history.setUser(resource.getUser());
        history.setAction("removed");
        history.setPreviousRole(resource.getRole());
        history.setPreviousAllocation(resource.getAllocation());
        history.setPerformedBy(performedBy);
        history.setNote("Removed from project");
        
        historyRepository.save(history);
        
        // Send notification
        notificationService.createNotification(
                resource.getUser().getId(),
                "You have been removed from project: " + resource.getProject().getName(),
                "/projects/" + resource.getProject().getId(),
                "project_removal"
        );
        
        // Send email notification
        try {
            emailService.sendProjectRemovalEmail(
                    resource.getUser().getEmail(),
                    resource.getUser().getFirstName() + " " + resource.getUser().getLastName(),
                    resource.getProject().getName()
            );
        } catch (Exception e) {
            // Log exception but don't fail the removal process
            System.err.println("Failed to send project removal email: " + e.getMessage());
        }
        
        resourceRepository.delete(resource);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getResourceHistoryByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return historyRepository.findByProjectIdOrderByDateDesc(projectId).stream()
                .map(this::convertHistoryToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getResourceHistoryByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return historyRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::convertHistoryToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getResourceHistoryByResourceId(Long resourceId) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException("Resource not found with id " + resourceId);
        }
        
        return historyRepository.findByProjectResourceIdOrderByDateDesc(resourceId).stream()
                .map(this::convertHistoryToDto)
                .collect(Collectors.toList());
    }
    
    // Helper methods
    
    private ResourceDto convertToDto(ProjectResource resource) {
        return ResourceDto.builder()
                .id(resource.getId())
                .projectId(resource.getProject().getId())
                .projectName(resource.getProject().getName())
                .userId(resource.getUser().getId())
                .userName(resource.getUser().getFirstName() + " " + resource.getUser().getLastName())
                .userEmail(resource.getUser().getEmail())
                .role(resource.getRole())
                .allocation(resource.getAllocation())
                .startDate(resource.getStartDate())
                .endDate(resource.getEndDate())
                .notes(resource.getNotes())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }
    
    private ResourceHistoryDto convertHistoryToDto(ResourceHistory history) {
        return ResourceHistoryDto.builder()
                .id(history.getId())
                .projectResourceId(history.getProjectResource().getId())
                .projectId(history.getProject().getId())
                .projectName(history.getProject().getName())
                .userId(history.getUser().getId())
                .userName(history.getUser().getFirstName() + " " + history.getUser().getLastName())
                .action(history.getAction())
                .previousRole(history.getPreviousRole())
                .newRole(history.getNewRole())
                .previousAllocation(history.getPreviousAllocation())
                .newAllocation(history.getNewAllocation())
                .performedById(history.getPerformedBy() != null ? history.getPerformedBy().getId() : null)
                .performedByName(history.getPerformedBy() != null ? 
                        history.getPerformedBy().getFirstName() + " " + history.getPerformedBy().getLastName() : null)
                .note(history.getNote())
                .date(history.getDate())
                .build();
    }
}
