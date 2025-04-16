package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/skill-history")
@RequiredArgsConstructor
public class SkillHistoryController {

    private final SkillHistoryService skillHistoryService;

    /**
     * Get history for a specific skill
     */
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isSkillOwner(#skillId, authentication.principal.id)")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryForSkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillHistoryService.getHistoryForSkill(skillId));
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
        
        return ResponseEntity.ok(skillHistoryService.getHistoryForUser(userId, startDate, endDate));
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
        
        return ResponseEntity.ok(skillHistoryService.getHistoryForUser(currentUser.getId(), startDate, endDate));
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
        
        return ResponseEntity.ok(skillHistoryService.getHistoryByField(field, startDate, endDate));
    }

    /**
     * Get recent history entries
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getRecentHistory(
            @RequestParam(defaultValue = "20") int limit) {
        
        return ResponseEntity.ok(skillHistoryService.getRecentHistory(limit));
    }
}