package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.model.Client;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ClientRepository;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {
    
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    
    public List<ProjectDto> getAllProjects() {
        return projectRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectDto getProjectById(Long id) {
        return projectRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("Project not found with id " + id));
    }
    
    public List<ProjectDto> getProjectsByClientId(Long clientId) {
        return projectRepository.findByClientId(clientId).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public List<ProjectDto> getProjectsByStatus(String status) {
        return projectRepository.findByStatus(status).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ProjectDto createProject(ProjectDto projectDto) {
        Project project = convertToEntity(projectDto);
        project.setCreatedAt(LocalDateTime.now());
        project = projectRepository.save(project);
        return convertToDto(project);
    }
    
    public ProjectDto updateProject(Long id, ProjectDto projectDto) {
        return projectRepository.findById(id)
            .map(project -> {
                project.setName(projectDto.getName());
                project.setDescription(projectDto.getDescription());
                project.setClientId(projectDto.getClientId());
                project.setStartDate(projectDto.getStartDate());
                project.setEndDate(projectDto.getEndDate());
                project.setLocation(projectDto.getLocation());
                project.setConfluenceLink(projectDto.getConfluenceLink());
                project.setLeadId(projectDto.getLeadId());
                project.setDeliveryLeadId(projectDto.getDeliveryLeadId());
                project.setStatus(projectDto.getStatus());
                project.setHrCoordinatorEmail(projectDto.getHrCoordinatorEmail());
                project.setFinanceTeamEmail(projectDto.getFinanceTeamEmail());
                project.setUpdatedAt(LocalDateTime.now());
                return convertToDto(projectRepository.save(project));
            })
            .orElseThrow(() -> new RuntimeException("Project not found with id " + id));
    }
    
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
    
    private ProjectDto convertToDto(Project project) {
        ProjectDto dto = ProjectDto.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .clientId(project.getClientId())
            .startDate(project.getStartDate())
            .endDate(project.getEndDate())
            .location(project.getLocation())
            .confluenceLink(project.getConfluenceLink())
            .leadId(project.getLeadId())
            .deliveryLeadId(project.getDeliveryLeadId())
            .status(project.getStatus())
            .hrCoordinatorEmail(project.getHrCoordinatorEmail())
            .financeTeamEmail(project.getFinanceTeamEmail())
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
        
        // Add derived fields from related entities
        if (project.getClientId() != null) {
            Optional<Client> client = clientRepository.findById(project.getClientId());
            client.ifPresent(c -> dto.setClientName(c.getName()));
        }
        
        if (project.getLeadId() != null) {
            Optional<User> lead = userRepository.findById(project.getLeadId());
            lead.ifPresent(l -> dto.setLeadName(l.getFirstName() + " " + l.getLastName()));
        }
        
        if (project.getDeliveryLeadId() != null) {
            Optional<User> deliveryLead = userRepository.findById(project.getDeliveryLeadId());
            deliveryLead.ifPresent(dl -> dto.setDeliveryLeadName(dl.getFirstName() + " " + dl.getLastName()));
        }
        
        return dto;
    }
    
    private Project convertToEntity(ProjectDto projectDto) {
        return Project.builder()
            .id(projectDto.getId())
            .name(projectDto.getName())
            .description(projectDto.getDescription())
            .clientId(projectDto.getClientId())
            .startDate(projectDto.getStartDate())
            .endDate(projectDto.getEndDate())
            .location(projectDto.getLocation())
            .confluenceLink(projectDto.getConfluenceLink())
            .leadId(projectDto.getLeadId())
            .deliveryLeadId(projectDto.getDeliveryLeadId())
            .status(projectDto.getStatus())
            .hrCoordinatorEmail(projectDto.getHrCoordinatorEmail())
            .financeTeamEmail(projectDto.getFinanceTeamEmail())
            .createdAt(projectDto.getCreatedAt())
            .updatedAt(projectDto.getUpdatedAt())
            .build();
    }
}
