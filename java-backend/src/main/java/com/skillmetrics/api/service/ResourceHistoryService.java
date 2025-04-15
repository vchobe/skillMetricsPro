package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ResourceHistoryDto;
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
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceHistoryService {

    private final ResourceHistoryRepository resourceHistoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByProjectId(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        List<ResourceHistory> historyList = resourceHistoryRepository.findByProjectIdOrderByDateDesc(projectId);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        List<ResourceHistory> historyList = resourceHistoryRepository.findByUserIdOrderByDateDesc(userId);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByProjectAndUser(Long projectId, Long userId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResourceNotFoundException("Project", "id", projectId);
        }
        
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "id", userId);
        }
        
        List<ResourceHistory> historyList = resourceHistoryRepository.findByProjectIdAndUserId(projectId, userId);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByAction(String action) {
        List<ResourceHistory> historyList = resourceHistoryRepository.findByAction(action);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByPerformedById(Long performedById) {
        if (!userRepository.existsById(performedById)) {
            throw new ResourceNotFoundException("User", "id", performedById);
        }
        
        List<ResourceHistory> historyList = resourceHistoryRepository.findByPerformedById(performedById);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<ResourceHistory> historyList = resourceHistoryRepository.findByDateBetween(startDate, endDate);
        
        return enrichHistoryDtos(historyList);
    }
    
    @Transactional(readOnly = true)
    public ResourceHistoryDto getHistoryById(Long id) {
        ResourceHistory history = resourceHistoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("ResourceHistory", "id", id));
        
        return enrichHistoryDtos(List.of(history)).get(0);
    }
    
    @Transactional(readOnly = true)
    public List<ResourceHistoryDto> getAllHistory() {
        List<ResourceHistory> historyList = resourceHistoryRepository.findAll();
        
        return enrichHistoryDtos(historyList);
    }
    
    // Helper method to enrich history DTOs with project and user names
    private List<ResourceHistoryDto> enrichHistoryDtos(List<ResourceHistory> historyList) {
        // Collect all project IDs and user IDs
        List<Long> projectIds = historyList.stream()
                .map(ResourceHistory::getProjectId)
                .distinct()
                .collect(Collectors.toList());
                
        List<Long> userIds = historyList.stream()
                .flatMap(history -> {
                    List<Long> ids = new java.util.ArrayList<>();
                    ids.add(history.getUserId());
                    if (history.getPerformedById() != null) {
                        ids.add(history.getPerformedById());
                    }
                    return ids.stream();
                })
                .distinct()
                .collect(Collectors.toList());
        
        // Batch fetch projects and users
        Map<Long, Project> projectMap = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Function.identity()));
                
        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        
        // Convert and enrich history items
        return historyList.stream()
                .map(history -> {
                    ResourceHistoryDto dto = new ResourceHistoryDto();
                    dto.setId(history.getId());
                    dto.setProjectId(history.getProjectId());
                    dto.setUserId(history.getUserId());
                    dto.setAction(history.getAction());
                    dto.setPreviousRole(history.getPreviousRole());
                    dto.setNewRole(history.getNewRole());
                    dto.setPreviousAllocation(history.getPreviousAllocation());
                    dto.setNewAllocation(history.getNewAllocation());
                    dto.setDate(history.getDate());
                    dto.setPerformedById(history.getPerformedById());
                    dto.setNote(history.getNote());
                    
                    // Add project and user names
                    Project project = projectMap.get(history.getProjectId());
                    if (project != null) {
                        dto.setProjectName(project.getName());
                    }
                    
                    User user = userMap.get(history.getUserId());
                    if (user != null) {
                        dto.setUserName(user.getFirstName() + " " + user.getLastName());
                    }
                    
                    if (history.getPerformedById() != null) {
                        User performer = userMap.get(history.getPerformedById());
                        if (performer != null) {
                            dto.setPerformedByName(performer.getFirstName() + " " + performer.getLastName());
                        }
                    }
                    
                    return dto;
                })
                .collect(Collectors.toList());
    }
}
