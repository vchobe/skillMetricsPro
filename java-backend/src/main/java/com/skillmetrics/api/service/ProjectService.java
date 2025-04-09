package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ProjectResourceRepository projectResourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final SkillRepository skillRepository;
    private final ResourceHistoryRepository resourceHistoryRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + id));
        
        return convertToDtoWithDetails(project);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByClientId(Long clientId) {
        return projectRepository.findByClientId(clientId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByLeadId(Long leadId) {
        return projectRepository.findByLeadId(leadId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByDeliveryLeadId(Long deliveryLeadId) {
        return projectRepository.findByDeliveryLeadId(deliveryLeadId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getActiveProjects() {
        LocalDate today = LocalDate.now();
        return projectRepository.findActiveProjectsAtDate(today).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> searchProjects(String term) {
        return projectRepository.searchProjects(term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByUserId(Long userId) {
        List<ProjectResource> resources = projectResourceRepository.findByUserId(userId);
        
        // Extract unique project IDs
        List<Long> projectIds = resources.stream()
                .map(resource -> resource.getProject().getId())
                .distinct()
                .collect(Collectors.toList());
        
        // Fetch complete project information for each project
        return projectIds.stream()
                .map(projectId -> projectRepository.findById(projectId).orElse(null))
                .filter(project -> project != null)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getActiveProjectsByUserId(Long userId) {
        LocalDate today = LocalDate.now();
        List<ProjectResource> resources = projectResourceRepository.findActiveResourcesByUserIdAtDate(userId, today);
        
        // Extract unique project IDs
        List<Long> projectIds = resources.stream()
                .map(resource -> resource.getProject().getId())
                .distinct()
                .collect(Collectors.toList());
        
        // Fetch complete project information for each project
        return projectIds.stream()
                .map(projectId -> projectRepository.findById(projectId).orElse(null))
                .filter(project -> project != null)
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getUserProjectsSummary(Long userId) {
        Map<String, Object> summary = new HashMap<>();
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        
        summary.put("userId", userId);
        summary.put("userName", user.getFirstName() + " " + user.getLastName());
        
        LocalDate today = LocalDate.now();
        List<ProjectResource> activeResources = projectResourceRepository.findActiveResourcesByUserIdAtDate(userId, today);
        List<ProjectResource> allResources = projectResourceRepository.findByUserId(userId);
        
        summary.put("activeProjectCount", activeResources.stream()
                .map(resource -> resource.getProject().getId())
                .distinct()
                .count());
        
        summary.put("totalProjectCount", allResources.stream()
                .map(resource -> resource.getProject().getId())
                .distinct()
                .count());
        
        // Get current allocation percentage
        Integer totalAllocation = projectResourceRepository.getTotalAllocationForUserAtDate(userId, today);
        summary.put("currentAllocation", totalAllocation != null ? totalAllocation : 0);
        
        // Get projects by role
        Map<String, Long> projectsByRole = allResources.stream()
                .collect(Collectors.groupingBy(ProjectResource::getRole, Collectors.counting()));
        summary.put("projectsByRole", projectsByRole);
        
        // Get active projects details
        List<Map<String, Object>> activeProjectDetails = activeResources.stream()
                .map(resource -> {
                    Map<String, Object> details = new HashMap<>();
                    Project project = resource.getProject();
                    details.put("projectId", project.getId());
                    details.put("projectName", project.getName());
                    details.put("role", resource.getRole());
                    details.put("allocation", resource.getAllocation());
                    return details;
                })
                .collect(Collectors.toList());
        
        summary.put("activeProjects", activeProjectDetails);
        
        return summary;
    }
    
    @Transactional
    public ProjectDto createProject(ProjectDto projectDto) {
        Project project = new Project();
        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        
        if (projectDto.getClientId() != null) {
            Client client = clientRepository.findById(projectDto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + projectDto.getClientId()));
            project.setClient(client);
        }
        
        project.setStartDate(projectDto.getStartDate());
        project.setEndDate(projectDto.getEndDate());
        project.setLocation(projectDto.getLocation());
        project.setConfluenceLink(projectDto.getConfluenceLink());
        
        if (projectDto.getLeadId() != null) {
            User lead = userRepository.findById(projectDto.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id " + projectDto.getLeadId()));
            project.setLead(lead);
        }
        
        if (projectDto.getDeliveryLeadId() != null) {
            User deliveryLead = userRepository.findById(projectDto.getDeliveryLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery lead not found with id " + projectDto.getDeliveryLeadId()));
            project.setDeliveryLead(deliveryLead);
        }
        
        project.setStatus(projectDto.getStatus());
        project.setHrCoordinatorEmail(projectDto.getHrCoordinatorEmail());
        project.setFinanceTeamEmail(projectDto.getFinanceTeamEmail());
        
        Project savedProject = projectRepository.save(project);
        
        // Notify leads
        if (project.getLead() != null) {
            notificationService.createNotification(
                    project.getLead().getId(),
                    "You have been assigned as lead for project: " + project.getName(),
                    "/projects/" + savedProject.getId(),
                    "project_assignment"
            );
        }
        
        if (project.getDeliveryLead() != null) {
            notificationService.createNotification(
                    project.getDeliveryLead().getId(),
                    "You have been assigned as delivery lead for project: " + project.getName(),
                    "/projects/" + savedProject.getId(),
                    "project_assignment"
            );
        }
        
        return convertToDto(savedProject);
    }
    
    @Transactional
    public ProjectDto updateProject(Long id, ProjectDto projectDto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + id));
        
        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        
        if (projectDto.getClientId() != null) {
            Client client = clientRepository.findById(projectDto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + projectDto.getClientId()));
            project.setClient(client);
        } else {
            project.setClient(null);
        }
        
        project.setStartDate(projectDto.getStartDate());
        project.setEndDate(projectDto.getEndDate());
        project.setLocation(projectDto.getLocation());
        project.setConfluenceLink(projectDto.getConfluenceLink());
        
        // Check if lead was changed
        Long oldLeadId = project.getLead() != null ? project.getLead().getId() : null;
        
        if (projectDto.getLeadId() != null) {
            User lead = userRepository.findById(projectDto.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with id " + projectDto.getLeadId()));
            project.setLead(lead);
            
            // Notify new lead if changed
            if (oldLeadId == null || !oldLeadId.equals(projectDto.getLeadId())) {
                notificationService.createNotification(
                        lead.getId(),
                        "You have been assigned as lead for project: " + project.getName(),
                        "/projects/" + id,
                        "project_assignment"
                );
            }
        } else {
            project.setLead(null);
        }
        
        // Check if delivery lead was changed
        Long oldDeliveryLeadId = project.getDeliveryLead() != null ? project.getDeliveryLead().getId() : null;
        
        if (projectDto.getDeliveryLeadId() != null) {
            User deliveryLead = userRepository.findById(projectDto.getDeliveryLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Delivery lead not found with id " + projectDto.getDeliveryLeadId()));
            project.setDeliveryLead(deliveryLead);
            
            // Notify new delivery lead if changed
            if (oldDeliveryLeadId == null || !oldDeliveryLeadId.equals(projectDto.getDeliveryLeadId())) {
                notificationService.createNotification(
                        deliveryLead.getId(),
                        "You have been assigned as delivery lead for project: " + project.getName(),
                        "/projects/" + id,
                        "project_assignment"
                );
            }
        } else {
            project.setDeliveryLead(null);
        }
        
        project.setStatus(projectDto.getStatus());
        project.setHrCoordinatorEmail(projectDto.getHrCoordinatorEmail());
        project.setFinanceTeamEmail(projectDto.getFinanceTeamEmail());
        
        Project updatedProject = projectRepository.save(project);
        
        return convertToDto(updatedProject);
    }
    
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + id));
        
        // Check if project has any resources assigned
        if (project.getResources() != null && !project.getResources().isEmpty()) {
            throw new IllegalStateException("Cannot delete project that has resources assigned");
        }
        
        projectRepository.delete(project);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceDto> getResourcesByProjectId(Long projectId) {
        // Check if project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return projectResourceRepository.findByProjectId(projectId).stream()
                .map(this::convertResourceToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectResourceDto addResourceToProject(ProjectResourceDto resourceDto, Long currentUserId) {
        Project project = projectRepository.findById(resourceDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + resourceDto.getProjectId()));
        
        User user = userRepository.findById(resourceDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + resourceDto.getUserId()));
        
        // Check if user is already assigned to the project with the same role
        projectResourceRepository.findByProjectIdAndUserIdAndRole(
                resourceDto.getProjectId(), resourceDto.getUserId(), resourceDto.getRole())
                .ifPresent(r -> {
                    throw new IllegalStateException("User is already assigned to this project with the role: " + resourceDto.getRole());
                });
        
        // Check user's allocation across projects
        LocalDate today = LocalDate.now();
        Integer currentAllocation = projectResourceRepository.getTotalAllocationForUserAtDate(resourceDto.getUserId(), today);
        if (currentAllocation != null && resourceDto.getAllocation() != null) {
            int newTotalAllocation = currentAllocation + resourceDto.getAllocation();
            if (newTotalAllocation > 100) {
                throw new IllegalStateException(
                        "User's total allocation would exceed 100%. Current allocation: " + currentAllocation + "%, attempting to add: " + resourceDto.getAllocation() + "%"
                );
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
        
        ProjectResource savedResource = projectResourceRepository.save(resource);
        
        // Create resource history record
        ResourceHistory history = new ResourceHistory();
        history.setProject(project);
        history.setUser(user);
        history.setAction("added");
        history.setNewRole(resource.getRole());
        history.setNewAllocation(resource.getAllocation());
        history.setDate(LocalDateTime.now());
        
        if (currentUserId != null) {
            User performedBy = userRepository.findById(currentUserId)
                    .orElse(null);
            history.setPerformedBy(performedBy);
        }
        
        resourceHistoryRepository.save(history);
        
        // Notify the assigned user
        notificationService.createNotification(
                user.getId(),
                "You have been assigned to project: " + project.getName() + " as " + resource.getRole(),
                "/projects/" + project.getId(),
                "project_assignment"
        );
        
        return convertResourceToDto(savedResource);
    }
    
    @Transactional
    public ProjectResourceDto updateResource(Long resourceId, ProjectResourceDto resourceDto, Long currentUserId) {
        ProjectResource resource = projectResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id " + resourceId));
        
        // Store previous values for history
        String previousRole = resource.getRole();
        Integer previousAllocation = resource.getAllocation();
        
        // Check if allocation is changing
        if (resourceDto.getAllocation() != null && !resourceDto.getAllocation().equals(previousAllocation)) {
            // Check user's allocation across projects
            LocalDate today = LocalDate.now();
            Integer currentAllocation = projectResourceRepository.getTotalAllocationForUserAtDate(resource.getUser().getId(), today);
            if (currentAllocation != null) {
                // Subtract the current allocation for this resource
                currentAllocation -= (previousAllocation != null ? previousAllocation : 0);
                // Add the new allocation
                int newTotalAllocation = currentAllocation + resourceDto.getAllocation();
                if (newTotalAllocation > 100) {
                    throw new IllegalStateException(
                            "User's total allocation would exceed 100%. Current allocation across other projects: " + 
                            currentAllocation + "%, attempting to set: " + resourceDto.getAllocation() + "%"
                    );
                }
            }
        }
        
        // Update the resource
        resource.setRole(resourceDto.getRole());
        resource.setAllocation(resourceDto.getAllocation());
        resource.setStartDate(resourceDto.getStartDate());
        resource.setEndDate(resourceDto.getEndDate());
        resource.setNotes(resourceDto.getNotes());
        
        ProjectResource updatedResource = projectResourceRepository.save(resource);
        
        // Determine the action for history
        String action;
        if (!previousRole.equals(resourceDto.getRole())) {
            action = "role_changed";
        } else if (previousAllocation != null && resourceDto.getAllocation() != null
                && !previousAllocation.equals(resourceDto.getAllocation())) {
            action = "allocation_changed";
        } else {
            action = "updated";
        }
        
        // Create resource history record
        ResourceHistory history = new ResourceHistory();
        history.setProject(resource.getProject());
        history.setUser(resource.getUser());
        history.setAction(action);
        history.setPreviousRole(previousRole);
        history.setNewRole(resource.getRole());
        history.setPreviousAllocation(previousAllocation);
        history.setNewAllocation(resource.getAllocation());
        history.setDate(LocalDateTime.now());
        
        if (currentUserId != null) {
            User performedBy = userRepository.findById(currentUserId)
                    .orElse(null);
            history.setPerformedBy(performedBy);
        }
        
        resourceHistoryRepository.save(history);
        
        // Notify the user about the change
        if ("role_changed".equals(action)) {
            notificationService.createNotification(
                    resource.getUser().getId(),
                    "Your role in project " + resource.getProject().getName() + " has been changed from " + 
                    previousRole + " to " + resource.getRole(),
                    "/projects/" + resource.getProject().getId(),
                    "project_update"
            );
        } else if ("allocation_changed".equals(action)) {
            notificationService.createNotification(
                    resource.getUser().getId(),
                    "Your allocation in project " + resource.getProject().getName() + " has been changed from " + 
                    previousAllocation + "% to " + resource.getAllocation() + "%",
                    "/projects/" + resource.getProject().getId(),
                    "project_update"
            );
        }
        
        return convertResourceToDto(updatedResource);
    }
    
    @Transactional
    public void removeResource(Long resourceId, Long currentUserId) {
        ProjectResource resource = projectResourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id " + resourceId));
        
        Project project = resource.getProject();
        User user = resource.getUser();
        String role = resource.getRole();
        Integer allocation = resource.getAllocation();
        
        // Create resource history record before deleting
        ResourceHistory history = new ResourceHistory();
        history.setProject(project);
        history.setUser(user);
        history.setAction("removed");
        history.setPreviousRole(role);
        history.setPreviousAllocation(allocation);
        history.setDate(LocalDateTime.now());
        
        if (currentUserId != null) {
            User performedBy = userRepository.findById(currentUserId)
                    .orElse(null);
            history.setPerformedBy(performedBy);
        }
        
        resourceHistoryRepository.save(history);
        
        // Delete the resource
        projectResourceRepository.delete(resource);
        
        // Notify the user about removal
        notificationService.createNotification(
                user.getId(),
                "You have been removed from project: " + project.getName(),
                "/projects/" + project.getId(),
                "project_update"
        );
    }
    
    @Transactional(readOnly = true)
    public List<ProjectSkillDto> getSkillsByProjectId(Long projectId) {
        // Check if project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return projectSkillRepository.findByProjectIdWithSkillDetails(projectId).stream()
                .map(this::convertSkillToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectSkillDto addSkillToProject(ProjectSkillDto skillDto) {
        Project project = projectRepository.findById(skillDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + skillDto.getProjectId()));
        
        Skill skill = skillRepository.findById(skillDto.getSkillId())
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id " + skillDto.getSkillId()));
        
        // Check if skill is already added to the project
        projectSkillRepository.findByProjectIdAndSkillId(skillDto.getProjectId(), skillDto.getSkillId())
                .ifPresent(s -> {
                    throw new IllegalStateException("This skill is already added to the project");
                });
        
        ProjectSkill projectSkill = new ProjectSkill();
        projectSkill.setProject(project);
        projectSkill.setSkill(skill);
        projectSkill.setRequiredLevel(skillDto.getRequiredLevel());
        
        ProjectSkill savedSkill = projectSkillRepository.save(projectSkill);
        
        return convertSkillToDto(savedSkill);
    }
    
    @Transactional
    public ProjectSkillDto updateProjectSkill(Long skillId, ProjectSkillDto skillDto) {
        ProjectSkill projectSkill = projectSkillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Project skill not found with id " + skillId));
        
        projectSkill.setRequiredLevel(skillDto.getRequiredLevel());
        
        ProjectSkill updatedSkill = projectSkillRepository.save(projectSkill);
        
        return convertSkillToDto(updatedSkill);
    }
    
    @Transactional
    public void removeSkillFromProject(Long skillId) {
        ProjectSkill projectSkill = projectSkillRepository.findById(skillId)
                .orElseThrow(() -> new ResourceNotFoundException("Project skill not found with id " + skillId));
        
        projectSkillRepository.delete(projectSkill);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getResourceHistoryByProjectId(Long projectId) {
        // Check if project exists
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project not found with id " + projectId);
        }
        
        return resourceHistoryRepository.findByProjectIdOrderByDateDesc(projectId).stream()
                .map(this::convertHistoryToDto)
                .collect(Collectors.toList());
    }
    
    // Helper methods
    
    private ProjectDto convertToDto(Project project) {
        ProjectDto dto = ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .location(project.getLocation())
                .confluenceLink(project.getConfluenceLink())
                .status(project.getStatus())
                .hrCoordinatorEmail(project.getHrCoordinatorEmail())
                .financeTeamEmail(project.getFinanceTeamEmail())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
                
        if (project.getClient() != null) {
            dto.setClientId(project.getClient().getId());
            dto.setClientName(project.getClient().getName());
        }
        
        if (project.getLead() != null) {
            dto.setLeadId(project.getLead().getId());
            dto.setLeadName(project.getLead().getFirstName() + " " + project.getLead().getLastName());
        }
        
        if (project.getDeliveryLead() != null) {
            dto.setDeliveryLeadId(project.getDeliveryLead().getId());
            dto.setDeliveryLeadName(project.getDeliveryLead().getFirstName() + " " + project.getDeliveryLead().getLastName());
        }
        
        return dto;
    }
    
    private ProjectDto convertToDtoWithDetails(Project project) {
        ProjectDto dto = convertToDto(project);
        
        // Add resources
        if (project.getResources() != null) {
            dto.setResources(project.getResources().stream()
                    .map(this::convertResourceToDto)
                    .collect(Collectors.toList()));
        } else {
            dto.setResources(new ArrayList<>());
        }
        
        // Add skills
        if (project.getSkills() != null) {
            dto.setSkills(project.getSkills().stream()
                    .map(this::convertSkillToDto)
                    .collect(Collectors.toList()));
        } else {
            dto.setSkills(new ArrayList<>());
        }
        
        return dto;
    }
    
    private ProjectResourceDto convertResourceToDto(ProjectResource resource) {
        ProjectResourceDto dto = ProjectResourceDto.builder()
                .id(resource.getId())
                .projectId(resource.getProject().getId())
                .userId(resource.getUser().getId())
                .userName(resource.getUser().getFirstName() + " " + resource.getUser().getLastName())
                .role(resource.getRole())
                .allocation(resource.getAllocation())
                .startDate(resource.getStartDate())
                .endDate(resource.getEndDate())
                .notes(resource.getNotes())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
                
        return dto;
    }
    
    private ProjectSkillDto convertSkillToDto(ProjectSkill projectSkill) {
        ProjectSkillDto dto = ProjectSkillDto.builder()
                .id(projectSkill.getId())
                .projectId(projectSkill.getProject().getId())
                .skillId(projectSkill.getSkill().getId())
                .skillName(projectSkill.getSkill().getName())
                .category(projectSkill.getSkill().getCategory())
                .level(projectSkill.getSkill().getLevel())
                .requiredLevel(projectSkill.getRequiredLevel())
                .createdAt(projectSkill.getCreatedAt())
                .updatedAt(projectSkill.getUpdatedAt())
                .build();
                
        return dto;
    }
    
    private ResourceHistoryDto convertHistoryToDto(ResourceHistory history) {
        ResourceHistoryDto dto = ResourceHistoryDto.builder()
                .id(history.getId())
                .projectId(history.getProject().getId())
                .projectName(history.getProject().getName())
                .userId(history.getUser().getId())
                .userName(history.getUser().getFirstName() + " " + history.getUser().getLastName())
                .action(history.getAction())
                .previousRole(history.getPreviousRole())
                .newRole(history.getNewRole())
                .previousAllocation(history.getPreviousAllocation())
                .newAllocation(history.getNewAllocation())
                .date(history.getDate())
                .note(history.getNote())
                .createdAt(history.getCreatedAt())
                .build();
                
        if (history.getPerformedBy() != null) {
            dto.setPerformedById(history.getPerformedBy().getId());
            dto.setPerformedByName(history.getPerformedBy().getFirstName() + " " + history.getPerformedBy().getLastName());
        }
                
        return dto;
    }
}
