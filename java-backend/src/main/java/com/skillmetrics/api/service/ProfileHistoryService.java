package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProfileHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.ProfileHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ProfileHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileHistoryService {
    
    private final ProfileHistoryRepository profileHistoryRepository;
    private final UserRepository userRepository;
    
    public List<ProfileHistoryDto> getAllProfileHistory() {
        return profileHistoryRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProfileHistoryDto> getProfileHistoryByUserId(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return profileHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProfileHistoryDto> getProfileHistoryByField(String fieldName) {
        return profileHistoryRepository.findByChangedFieldOrderByCreatedAtDesc(fieldName).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public List<ProfileHistoryDto> getProfileHistoryBetweenDates(LocalDateTime startDate, LocalDateTime endDate) {
        return profileHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDate, endDate).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ProfileHistoryDto createProfileHistory(ProfileHistoryDto historyDto) {
        ProfileHistory profileHistory = convertToEntity(historyDto);
        ProfileHistory savedHistory = profileHistoryRepository.save(profileHistory);
        return convertToDto(savedHistory);
    }
    
    @Transactional
    public void trackProfileChange(Long userId, String field, String oldValue, String newValue) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Only create history if values are different
        if ((oldValue == null && newValue != null) || 
            (oldValue != null && !oldValue.equals(newValue))) {
            
            ProfileHistory history = ProfileHistory.builder()
                    .user(user)
                    .changedField(field)
                    .previousValue(oldValue)
                    .newValue(newValue)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            profileHistoryRepository.save(history);
        }
    }
    
    // Helper methods for entity <-> DTO conversion
    
    private ProfileHistoryDto convertToDto(ProfileHistory history) {
        ProfileHistoryDto dto = new ProfileHistoryDto();
        BeanUtils.copyProperties(history, dto);
        
        dto.setUserId(history.getUser().getId());
        
        // Set user details for display
        dto.setUserName(history.getUser().getFirstName() + " " + history.getUser().getLastName());
        dto.setUserEmail(history.getUser().getEmail());
        
        return dto;
    }
    
    private ProfileHistory convertToEntity(ProfileHistoryDto dto) {
        ProfileHistory entity = new ProfileHistory();
        BeanUtils.copyProperties(dto, entity, "userId", "userName", "userEmail");
        
        // Set user
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));
        entity.setUser(user);
        
        return entity;
    }
}