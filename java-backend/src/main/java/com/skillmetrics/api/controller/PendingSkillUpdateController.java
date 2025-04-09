package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.PendingSkillUpdateDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.PendingSkillUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PendingSkillUpdateController {
    
    private final PendingSkillUpdateService pendingSkillUpdateService;
    
    @GetMapping("/pending-updates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getAllPendingUpdates() {
        return ResponseEntity.ok(pendingSkillUpdateService.getAllPendingUpdates());
    }
    
    @GetMapping("/pending-updates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isResourceOwner(authentication.principal.id, #id, 'pending_update')")
    public ResponseEntity<PendingSkillUpdateDto> getPendingUpdateById(@PathVariable Long id) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingUpdateById(id));
    }
    
    @GetMapping("/users/{userId}/pending-updates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingUpdatesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingUpdatesByUserId(userId));
    }
    
    @GetMapping("/skills/{skillId}/pending-updates")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @securityService.isResourceOwner(authentication.principal.id, #skillId, 'skill')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingUpdatesBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingUpdatesBySkillId(skillId));
    }
    
    @GetMapping("/pending-updates/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingUpdatesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingUpdatesByStatus(status));
    }
    
    @PostMapping("/pending-updates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PendingSkillUpdateDto> createPendingUpdate(
            @RequestBody PendingSkillUpdateDto pendingUpdateDto,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.createPendingUpdate(pendingUpdateDto, currentUser.getId()));
    }
    
    @PostMapping("/pending-updates/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> approvePendingUpdate(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.approvePendingUpdate(id, currentUser.getId()));
    }
    
    @PostMapping("/pending-updates/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> rejectPendingUpdate(
            @PathVariable Long id,
            @RequestBody Map<String, String> rejectionData,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.rejectPendingUpdate(
                id, rejectionData.get("rejectionReason"), currentUser.getId()));
    }
    
    @DeleteMapping("/pending-updates/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isResourceOwner(authentication.principal.id, #id, 'pending_update')")
    public ResponseEntity<Void> deletePendingUpdate(@PathVariable Long id) {
        pendingSkillUpdateService.deletePendingUpdate(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/user/pending-updates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserPendingUpdates(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingUpdatesByUserId(currentUser.getId()));
    }
}