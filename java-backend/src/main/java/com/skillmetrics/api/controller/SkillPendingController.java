package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.PendingSkillUpdateDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.PendingSkillUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Controller for pending skill updates - Legacy endpoint for Node.js compatibility
 * This controller provides compatibility with the existing frontend by mapping 
 * the Node.js endpoints to the Java backend.
 */
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillPendingController {

    private final PendingSkillUpdateService pendingSkillUpdateService;

    /**
     * Create a new pending skill update - Legacy endpoint
     * This endpoint is compatible with the original Node.js backend
     */
    @PostMapping("/pending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PendingSkillUpdateDto> createPendingSkillUpdate(
            @Valid @RequestBody PendingSkillUpdateDto dto,
            @CurrentUser UserPrincipal currentUser) {
        
        // If userId is not explicitly set, use the current user's ID
        if (dto.getUserId() == null) {
            dto.setUserId(currentUser.getId());
        }
        
        // Only the current user or admin can create pending updates on behalf of the user
        if (!currentUser.getId().equals(dto.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        // Set created timestamp if not provided
        if (dto.getCreatedAt() == null) {
            dto.setCreatedAt(LocalDateTime.now());
        }
        
        // Ensure status is set to PENDING if not specified
        if (dto.getStatus() == null || dto.getStatus().isEmpty()) {
            dto.setStatus("PENDING");
        }
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(pendingSkillUpdateService.createPendingSkillUpdate(dto));
    }

    /**
     * Get pending skill updates for the current user - Legacy endpoint
     */
    @GetMapping("/user/pending-skills")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserPendingSkillUpdates(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(
                pendingSkillUpdateService.getPendingSkillUpdatesByUserId(currentUser.getId()));
    }
    
    /**
     * Get all pending skill updates - Legacy endpoint
     * Admin only
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getAllPendingSkillUpdates() {
        return ResponseEntity.ok(pendingSkillUpdateService.getAllPendingSkillUpdates());
    }
    
    /**
     * Get a pending skill update by ID - Legacy endpoint
     */
    @GetMapping("/pending/{id}")
    @PreAuthorize("hasRole('ADMIN') or @pendingSkillUpdateService.getPendingSkillUpdateById(#id).userId == authentication.principal.id")
    public ResponseEntity<PendingSkillUpdateDto> getPendingSkillUpdateById(@PathVariable Long id) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdateById(id));
    }
    
    /**
     * Approve a pending skill update - Legacy endpoint
     */
    @PostMapping("/pending/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PendingSkillUpdateDto> approvePendingSkillUpdate(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(
                pendingSkillUpdateService.approvePendingSkillUpdate(id, comment, currentUser.getId()));
    }
    
    /**
     * Reject a pending skill update - Legacy endpoint
     */
    @PostMapping("/pending/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PendingSkillUpdateDto> rejectPendingSkillUpdate(
            @PathVariable Long id,
            @RequestParam(required = false) String comment,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(
                pendingSkillUpdateService.rejectPendingSkillUpdate(id, comment, currentUser.getId()));
    }
}