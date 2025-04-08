package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.service.SkillHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skill-history")
@RequiredArgsConstructor
public class SkillHistoryController {

    private final SkillHistoryService skillHistoryService;

    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryForSkill(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillHistoryService.getHistoryForSkill(skillId));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(skillHistoryService.getHistoryForUser(userId));
    }
    
    @GetMapping("/user/{userId}/action/{action}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillHistoryDto>> getHistoryByAction(
            @PathVariable Long userId, @PathVariable String action) {
        return ResponseEntity.ok(skillHistoryService.getHistoryByAction(userId, action));
    }
    
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getRecentHistory(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(skillHistoryService.getRecentHistory(days));
    }
}
