package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Client;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ClientRepository;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        
        return mapToDto(project);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectDto createProject(ProjectDto projectDto) {
        Project project = new Project();
        
        // Set basic fields
        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        project.setStartDate(projectDto.getStartDate());
        project.setEndDate(projectDto.getEndDate());
        project.setLocation(projectDto.getLocation());
        project.setConfluenceLink(projectDto.getConfluenceLink());
        project.setStatus(projectDto.getStatus());
        project.setHrCoordinatorEmail(projectDto.getHrCoordinatorEmail());
        project.setFinanceTeamEmail(projectDto.getFinanceTeamEmail());
        
        // Set client if provided
        if (projectDto.getClientId() != null) {
            Client client = clientRepository.findById(projectDto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", "id", projectDto.getClientId()));
            project.setClient(client);
        }
        
        // Set lead if provided
        if (projectDto.getLeadId() != null) {
            User lead = userRepository.findById(projectDto.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectDto.getLeadId()));
            project.setLead(lead);
        }
        
        // Set delivery lead if provided
        if (projectDto.getDeliveryLeadId() != null) {
            User deliveryLead = userRepository.findById(projectDto.getDeliveryLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectDto.getDeliveryLeadId()));
            project.setDeliveryLead(deliveryLead);
        }
        
        Project savedProject = projectRepository.save(project);
        
        return mapToDto(savedProject);
    }
    
    @Transactional
    public ProjectDto updateProject(Long id, ProjectDto projectDto) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));
        
        // Update basic fields
        project.setName(projectDto.getName());
        project.setDescription(projectDto.getDescription());
        project.setStartDate(projectDto.getStartDate());
        project.setEndDate(projectDto.getEndDate());
        project.setLocation(projectDto.getLocation());
        project.setConfluenceLink(projectDto.getConfluenceLink());
        project.setStatus(projectDto.getStatus());
        project.setHrCoordinatorEmail(projectDto.getHrCoordinatorEmail());
        project.setFinanceTeamEmail(projectDto.getFinanceTeamEmail());
        
        // Update client if provided
        if (projectDto.getClientId() != null) {
            Client client = clientRepository.findById(projectDto.getClientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Client", "id", projectDto.getClientId()));
            project.setClient(client);
        } else {
            project.setClient(null);
        }
        
        // Update lead if provided
        if (projectDto.getLeadId() != null) {
            User lead = userRepository.findById(projectDto.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectDto.getLeadId()));
            project.setLead(lead);
        } else {
            project.setLead(null);
        }
        
        // Update delivery lead if provided
        if (projectDto.getDeliveryLeadId() != null) {
            User deliveryLead = userRepository.findById(projectDto.getDeliveryLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", projectDto.getDeliveryLeadId()));
            project.setDeliveryLead(deliveryLead);
        } else {
            project.setDeliveryLead(null);
        }
        
        Project updatedProject = projectRepository.save(project);
        
        return mapToDto(updatedProject);
    }
    
    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project", "id", id);
        }
        
        projectRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByClientId(Long clientId) {
        if (!clientRepository.existsById(clientId)) {
            throw new ResourceNotFoundException("Client", "id", clientId);
        }
        
        return projectRepository.findByClientId(clientId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByLeadId(Long leadId) {
        if (!userRepository.existsById(leadId)) {
            throw new ResourceNotFoundException("User", "id", leadId);
        }
        
        return projectRepository.findByLeadId(leadId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByLocation(String location) {
        return projectRepository.findByLocation(location).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getActiveProjects() {
        LocalDate today = LocalDate.now();
        return projectRepository.findByStartDateAfter(today.minusDays(1)).stream()
                .filter(project -> project.getEndDate() == null || project.getEndDate().isAfter(today))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> searchProjectsByName(String keyword) {
        return projectRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    // Helper method to map Project entity to ProjectDto
    private ProjectDto mapToDto(Project project) {
        ProjectDto projectDto = new ProjectDto();
        projectDto.setId(project.getId());
        projectDto.setName(project.getName());
        projectDto.setDescription(project.getDescription());
        
        if (project.getClient() != null) {
            projectDto.setClientId(project.getClient().getId());
            projectDto.setClientName(project.getClient().getName());
        }
        
        projectDto.setStartDate(project.getStartDate());
        projectDto.setEndDate(project.getEndDate());
        projectDto.setLocation(project.getLocation());
        projectDto.setConfluenceLink(project.getConfluenceLink());
        
        if (project.getLead() != null) {
            projectDto.setLeadId(project.getLead().getId());
            projectDto.setLeadName(project.getLead().getUsername());
        }
        
        if (project.getDeliveryLead() != null) {
            projectDto.setDeliveryLeadId(project.getDeliveryLead().getId());
            projectDto.setDeliveryLeadName(project.getDeliveryLead().getUsername());
        }
        
        projectDto.setStatus(project.getStatus());
        projectDto.setHrCoordinatorEmail(project.getHrCoordinatorEmail());
        projectDto.setFinanceTeamEmail(project.getFinanceTeamEmail());
        projectDto.setCreatedAt(project.getCreatedAt());
        projectDto.setUpdatedAt(project.getUpdatedAt());
        
        return projectDto;
    }
}
