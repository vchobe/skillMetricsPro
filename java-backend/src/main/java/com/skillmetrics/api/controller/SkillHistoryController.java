package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.SkillHistory;
import com.skillmetrics.api.repository.SkillHistoryRepository;
import com.skillmetrics.api.repository.SkillRepository;
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
@RequestMapping("/api/skill-history")
@RequiredArgsConstructor
public class SkillHistoryController {

    private final SkillHistoryRepository skillHistoryRepository;
    private final SkillRepository skillRepository;

    /**
     * Get history for a specific skill
     */
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isSkillOwner(#skillId, authentication.principal.id)")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryForSkill(@PathVariable Long skillId) {
        // Verify skill exists
        if (!skillRepository.existsById(skillId)) {
            throw new ResourceNotFoundException("Skill not found with id: " + skillId);
        }
        
        List<SkillHistory> history = skillHistoryRepository.findBySkillIdOrderByCreatedAtDesc(skillId);
        
        return ResponseEntity.ok(history.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Get history for all skills of a user
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryForUser(
            @PathVariable Long userId,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        List<SkillHistory> history;
        
        if (startDate != null && endDate != null) {
            history = skillHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    userId, startDate, endDate);
        } else {
            history = skillHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        return ResponseEntity.ok(history.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Get history for the current user's skills
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillHistoryDto>> getMyHistory(
            @CurrentUser UserPrincipal currentUser,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        List<SkillHistory> history;
        
        if (startDate != null && endDate != null) {
            history = skillHistoryRepository.findByUserIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                    currentUser.getId(), startDate, endDate);
        } else {
            history = skillHistoryRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        }
        
        return ResponseEntity.ok(history.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Get history of field changes (e.g., level changes, category changes)
     */
    @GetMapping("/field/{field}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryByField(
            @PathVariable String field,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        
        List<SkillHistory> history;
        
        if (startDate != null && endDate != null) {
            history = skillHistoryRepository.findByFieldAndCreatedAtBetweenOrderByCreatedAtDesc(
                    field, startDate, endDate);
        } else {
            history = skillHistoryRepository.findByFieldOrderByCreatedAtDesc(field);
        }
        
        return ResponseEntity.ok(history.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    /**
     * Get recent history entries
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getRecentHistory(
            @RequestParam(defaultValue = "20") int limit) {
        
        List<SkillHistory> history = skillHistoryRepository.findTop20ByOrderByCreatedAtDesc();
        
        // Apply custom limit if different from default
        if (limit != 20 && history.size() > limit) {
            history = history.subList(0, limit);
        }
        
        return ResponseEntity.ok(history.stream().map(this::convertToDto).collect(Collectors.toList()));
    }

    // Helper method to convert entity to DTO
    private SkillHistoryDto convertToDto(SkillHistory history) {
        SkillHistoryDto dto = new SkillHistoryDto();
        dto.setId(history.getId());
        dto.setSkillId(history.getSkillId());
        dto.setUserId(history.getUserId());
        dto.setField(history.getField());
        dto.setOldValue(history.getOldValue());
        dto.setNewValue(history.getNewValue());
        dto.setChangedBy(history.getChangedBy());
        dto.setCreatedAt(history.getCreatedAt());
        return dto;
    }
}