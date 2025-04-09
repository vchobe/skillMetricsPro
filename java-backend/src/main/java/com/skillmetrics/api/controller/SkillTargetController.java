package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillTargetDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillTargetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SkillTargetController {
    
    private final SkillTargetService skillTargetService;
    
    @GetMapping("/skill-targets")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SkillTargetDto>> getAllSkillTargets() {
        return ResponseEntity.ok(skillTargetService.getAllSkillTargets());
    }
    
    @GetMapping("/skill-targets/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isResourceOwner(authentication.principal.id, #id, 'skill_target')")
    public ResponseEntity<SkillTargetDto> getSkillTargetById(@PathVariable Long id) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetById(id));
    }
    
    @GetMapping("/users/{userId}/skill-targets")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getSkillTargetsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserId(userId));
    }
    
    @GetMapping("/users/{userId}/skill-targets/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getSkillTargetsByUserIdAndStatus(
            @PathVariable Long userId, @PathVariable String status) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserIdAndStatus(userId, status));
    }
    
    @GetMapping("/skill-targets/upcoming")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillTargetDto>> getUpcomingSkillTargets(
            @RequestParam(name = "days", defaultValue = "30") int days) {
        return ResponseEntity.ok(skillTargetService.getUpcomingSkillTargets(days));
    }
    
    @GetMapping("/skill-targets/near-completion")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillTargetDto>> getNearCompletionTargets() {
        return ResponseEntity.ok(skillTargetService.getNearCompletionTargets());
    }
    
    @PostMapping("/skill-targets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillTargetDto> createSkillTarget(
            @RequestBody SkillTargetDto skillTargetDto,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.createSkillTarget(skillTargetDto, currentUser.getId()));
    }
    
    @PutMapping("/skill-targets/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isResourceOwner(authentication.principal.id, #id, 'skill_target')")
    public ResponseEntity<SkillTargetDto> updateSkillTarget(
            @PathVariable Long id, @RequestBody SkillTargetDto skillTargetDto) {
        return ResponseEntity.ok(skillTargetService.updateSkillTarget(id, skillTargetDto));
    }
    
    @PatchMapping("/skill-targets/{id}/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isResourceOwner(authentication.principal.id, #id, 'skill_target')")
    public ResponseEntity<SkillTargetDto> updateSkillTargetProgress(
            @PathVariable Long id, @RequestParam Integer progress) {
        return ResponseEntity.ok(skillTargetService.updateSkillTargetProgress(id, progress));
    }
    
    @DeleteMapping("/skill-targets/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isResourceOwner(authentication.principal.id, #id, 'skill_target')")
    public ResponseEntity<Void> deleteSkillTarget(@PathVariable Long id) {
        skillTargetService.deleteSkillTarget(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/users/{userId}/skill-targets/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> getUserSkillTargetsSummary(@PathVariable Long userId) {
        return ResponseEntity.ok(skillTargetService.getUserSkillTargetsSummary(userId));
    }
    
    @GetMapping("/user/skill-targets")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTargetDto>> getCurrentUserSkillTargets(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserId(currentUser.getId()));
    }
    
    @GetMapping("/user/skill-targets/summary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCurrentUserSkillTargetsSummary(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getUserSkillTargetsSummary(currentUser.getId()));
    }
}