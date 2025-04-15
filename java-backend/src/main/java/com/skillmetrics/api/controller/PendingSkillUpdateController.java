package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.PendingSkillUpdateDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.PendingSkillUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pending-updates")
@RequiredArgsConstructor
public class PendingSkillUpdateController {

    private final PendingSkillUpdateService pendingSkillUpdateService;

    /**
     * Get all pending skill updates
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getAllPendingSkillUpdates() {
        return ResponseEntity.ok(pendingSkillUpdateService.getAllPendingSkillUpdates());
    }

    /**
     * Get pending skill updates by status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingSkillUpdatesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByStatus(status));
    }

    /**
     * Get pending skill updates by user ID
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingSkillUpdatesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByUserId(userId));
    }

    /**
     * Get pending skill updates for the current user
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserPendingSkillUpdates(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByUserId(currentUser.getId()));
    }

    /**
     * Get pending skill updates by user ID and status
     */
    @GetMapping("/user/{userId}/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingSkillUpdatesByUserIdAndStatus(
            @PathVariable Long userId, @PathVariable String status) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByUserIdAndStatus(userId, status));
    }

    /**
     * Get current user's pending skill updates by status
     */
    @GetMapping("/me/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserPendingSkillUpdatesByStatus(
            @PathVariable String status, @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByUserIdAndStatus(currentUser.getId(), status));
    }

    /**
     * Get pending skill updates assigned to a reviewer
     */
    @GetMapping("/reviewer/{reviewerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #reviewerId == authentication.principal.id")
    public ResponseEntity<List<PendingSkillUpdateDto>> getPendingSkillUpdatesByReviewerId(@PathVariable Long reviewerId) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByReviewerId(reviewerId));
    }

    /**
     * Get pending skill updates assigned to the current user for review
     */
    @GetMapping("/me/reviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<PendingSkillUpdateDto>> getCurrentUserReviews(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdatesByReviewerId(currentUser.getId()));
    }

    /**
     * Get a pending skill update by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @pendingSkillUpdateService.getPendingSkillUpdateById(#id).userId == authentication.principal.id or @pendingSkillUpdateService.getPendingSkillUpdateById(#id).reviewerId == authentication.principal.id")
    public ResponseEntity<PendingSkillUpdateDto> getPendingSkillUpdateById(@PathVariable Long id) {
        return ResponseEntity.ok(pendingSkillUpdateService.getPendingSkillUpdateById(id));
    }

    /**
     * Create a new pending skill update
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #pendingSkillUpdateDto.userId == authentication.principal.id")
    public ResponseEntity<PendingSkillUpdateDto> createPendingSkillUpdate(
            @Valid @RequestBody PendingSkillUpdateDto pendingSkillUpdateDto) {
        return ResponseEntity.ok(pendingSkillUpdateService.createPendingSkillUpdate(pendingSkillUpdateDto));
    }

    /**
     * Create a pending skill update for the current user
     */
    @PostMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PendingSkillUpdateDto> createCurrentUserPendingSkillUpdate(
            @Valid @RequestBody PendingSkillUpdateDto pendingSkillUpdateDto,
            @CurrentUser UserPrincipal currentUser) {
        
        pendingSkillUpdateDto.setUserId(currentUser.getId());
        return ResponseEntity.ok(pendingSkillUpdateService.createPendingSkillUpdate(pendingSkillUpdateDto));
    }

    /**
     * Assign a reviewer to a pending skill update
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> assignReviewer(
            @PathVariable Long id, @RequestParam Long reviewerId) {
        return ResponseEntity.ok(pendingSkillUpdateService.assignReviewer(id, reviewerId));
    }

    /**
     * Assign the current user as a reviewer to a pending skill update
     */
    @PutMapping("/{id}/assign/me")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> assignCurrentUserAsReviewer(
            @PathVariable Long id, @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.assignReviewer(id, currentUser.getId()));
    }

    /**
     * Approve a pending skill update
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> approvePendingSkillUpdate(
            @PathVariable Long id, 
            @RequestParam(required = false) String comments,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.approvePendingSkillUpdate(id, comments, currentUser.getId()));
    }

    /**
     * Reject a pending skill update
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PendingSkillUpdateDto> rejectPendingSkillUpdate(
            @PathVariable Long id, 
            @RequestParam(required = false) String comments,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(pendingSkillUpdateService.rejectPendingSkillUpdate(id, comments, currentUser.getId()));
    }

    /**
     * Delete a pending skill update
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @pendingSkillUpdateService.getPendingSkillUpdateById(#id).userId == authentication.principal.id")
    public ResponseEntity<Map<String, Boolean>> deletePendingSkillUpdate(@PathVariable Long id) {
        pendingSkillUpdateService.deletePendingSkillUpdate(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    /**
     * Count pending updates
     */
    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Long>> countPendingUpdates() {
        return ResponseEntity.ok(Map.of("count", pendingSkillUpdateService.countPendingUpdates()));
    }

    /**
     * Count pending updates for a user
     */
    @GetMapping("/count/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Long>> countPendingUpdatesForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("count", pendingSkillUpdateService.countPendingUpdatesForUser(userId)));
    }

    /**
     * Count pending updates for the current user
     */
    @GetMapping("/count/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> countCurrentUserPendingUpdates(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(Map.of("count", pendingSkillUpdateService.countPendingUpdatesForUser(currentUser.getId())));
    }
}