package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectResourceHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Project;
import com.skillmetrics.api.model.ResourceHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ResourceHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectResourceHistoryService {

    private final ResourceHistoryRepository resourceHistoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResourceHistoryDto> getHistoryByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return resourceHistoryRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectResourceHistoryDto> getHistoryByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        return resourceHistoryRepository.findByProjectIdOrderByDateDesc(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProjectResourceHistoryDto recordAction(ProjectResourceHistoryDto historyDto) {
        User user = userRepository.findById(historyDto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", historyDto.getUserId()));
                
        Project project = projectRepository.findById(historyDto.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", historyDto.getProjectId()));
                
        User performedBy = null;
        if (historyDto.getPerformedById() != null) {
            performedBy = userRepository.findById(historyDto.getPerformedById())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", historyDto.getPerformedById()));
        }
        
        ResourceHistory history = new ResourceHistory();
        history.setUser(user);
        history.setProject(project);
        history.setAction(historyDto.getAction());
        history.setPreviousRole(historyDto.getPreviousRole());
        history.setNewRole(historyDto.getNewRole());
        history.setPreviousAllocation(historyDto.getPreviousAllocation());
        history.setNewAllocation(historyDto.getNewAllocation());
        history.setDate(LocalDateTime.now());
        history.setPerformedBy(performedBy);
        history.setNote(historyDto.getNote());
        
        ResourceHistory savedHistory = resourceHistoryRepository.save(history);
        
        return mapToDto(savedHistory);
    }
    
    private ProjectResourceHistoryDto mapToDto(ResourceHistory history) {
        ProjectResourceHistoryDto dto = new ProjectResourceHistoryDto();
        dto.setId(history.getId());
        
        dto.setProjectId(history.getProject().getId());
        dto.setProjectName(history.getProject().getName());
        
        dto.setUserId(history.getUser().getId());
        dto.setUserName(history.getUser().getFirstName() + " " + history.getUser().getLastName());
        
        dto.setAction(history.getAction());
        dto.setPreviousRole(history.getPreviousRole());
        dto.setNewRole(history.getNewRole());
        dto.setPreviousAllocation(history.getPreviousAllocation());
        dto.setNewAllocation(history.getNewAllocation());
        dto.setDate(history.getDate());
        
        if (history.getPerformedBy() != null) {
            dto.setPerformedById(history.getPerformedBy().getId());
            dto.setPerformedByName(history.getPerformedBy().getFirstName() + " " + 
                    history.getPerformedBy().getLastName());
        }
        
        dto.setNote(history.getNote());
        
        return dto;
    }
}