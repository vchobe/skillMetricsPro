package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProfileHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.ProfileHistory;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.ProfileHistoryRepository;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile-history")
@RequiredArgsConstructor
public class ProfileHistoryController {

    private final ProfileHistoryRepository profileHistoryRepository;
    private final UserRepository userRepository;

    /**
     * Get profile history for a specific user
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<ProfileHistoryDto>> getProfileHistoryForUser(
            @PathVariable Long userId,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        // Verify user exists
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        List<ProfileHistory> history;
        
        if (startDate != null && endDate != null) {
            history = profileHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    userId, startDate, endDate);
        } else {
            history = profileHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        return ResponseEntity.ok(history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get profile history for the current user
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProfileHistoryDto>> getMyProfileHistory(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        List<ProfileHistory> history;
        
        if (startDate != null && endDate != null) {
            history = profileHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    currentUser.getId(), startDate, endDate);
        } else {
            history = profileHistoryRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        }
        
        return ResponseEntity.ok(history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get history of changes to a specific field
     */
    @GetMapping("/field/{field}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<ProfileHistoryDto>> getHistoryByField(
            @PathVariable String field,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        List<ProfileHistory> history;
        
        if (startDate != null && endDate != null) {
            history = profileHistoryRepository.findByFieldAndCreatedAtBetweenOrderByCreatedAtDesc(
                    field, startDate, endDate);
        } else {
            history = profileHistoryRepository.findByFieldOrderByCreatedAtDesc(field);
        }
        
        return ResponseEntity.ok(history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get recent profile changes
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<ProfileHistoryDto>> getRecentChanges(
            @RequestParam(defaultValue = "20") int limit) {
        
        List<ProfileHistory> history = profileHistoryRepository.findTop20ByOrderByCreatedAtDesc();
        
        // Apply custom limit if different from default
        if (limit != 20 && history.size() > limit) {
            history = history.subList(0, limit);
        }
        
        return ResponseEntity.ok(history.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList()));
    }

    /**
     * Get a summary of profile changes by field
     */
    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Object>> getProfileChangesSummary() {
        return ResponseEntity.ok(profileHistoryRepository.countChangesByField());
    }

    // Helper method to convert entity to DTO
    private ProfileHistoryDto convertToDto(ProfileHistory history) {
        ProfileHistoryDto dto = new ProfileHistoryDto();
        dto.setId(history.getId());
        dto.setUserId(history.getUserId());
        dto.setField(history.getField());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setChangedBy(history.getChangedBy());
        dto.setCreatedAt(history.getCreatedAt());
        
        // Add user information
        userRepository.findById(history.getUserId()).ifPresent(user -> {
            dto.setUserFullName(user.getFirstName() + " " + user.getLastName());
            dto.setUserEmail(user.getEmail());
        });
        
        return dto;
    }
}