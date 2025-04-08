package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.ResourceHistory;
import com.skillmetrics.api.repository.ProjectRepository;
import com.skillmetrics.api.repository.ResourceHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceHistoryService {

    private final ResourceHistoryRepository resourceHistoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public ResourceHistoryDto getHistoryById(Long id) {
        ResourceHistory history = resourceHistoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResourceHistory", "id", id));
        
        return mapToDto(history);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        return resourceHistoryRepository.findByProjectIdOrderByDateDesc(projectId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return resourceHistoryRepository.findByUserIdOrderByDateDesc(userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByProjectAndUser(Long projectId, Long userId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        return resourceHistoryRepository.findByProjectIdAndUserIdOrderByDateDesc(projectId, userId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByAction(String action) {
        return resourceHistoryRepository.findByActionOrderByDateDesc(action).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getAllHistory() {
        return resourceHistoryRepository.findAllByOrderByDateDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    // Helper method to map ResourceHistory entity to ResourceHistoryDto
    private ResourceHistoryDto mapToDto(ResourceHistory history) {
        ResourceHistoryDto historyDto = new ResourceHistoryDto();
        historyDto.setId(history.getId());
        historyDto.setProjectId(history.getProject().getId());
        historyDto.setProjectName(history.getProject().getName());
        historyDto.setUserId(history.getUser().getId());
        
        // Combine first and last name if available, otherwise use username
        String userName = history.getUser().getUsername();
        if (history.getUser().getFirstName() != null && history.getUser().getLastName() != null) {
            userName = history.getUser().getFirstName() + " " + history.getUser().getLastName();
        }
        historyDto.setUserName(userName);
        
        historyDto.setAction(history.getAction());
        historyDto.setPreviousRole(history.getPreviousRole());
        historyDto.setNewRole(history.getNewRole());
        historyDto.setPreviousAllocation(history.getPreviousAllocation());
        historyDto.setNewAllocation(history.getNewAllocation());
        historyDto.setDate(history.getDate());
        
        if (history.getPerformedBy() != null) {
            historyDto.setPerformedById(history.getPerformedBy().getId());
            
            // Combine first and last name if available, otherwise use username
            String performedByName = history.getPerformedBy().getUsername();
            if (history.getPerformedBy().getFirstName() != null && history.getPerformedBy().getLastName() != null) {
                performedByName = history.getPerformedBy().getFirstName() + " " + history.getPerformedBy().getLastName();
            }
            historyDto.setPerformedByName(performedByName);
        }
        
        historyDto.setNote(history.getNote());
        
        return historyDto;
    }
}
