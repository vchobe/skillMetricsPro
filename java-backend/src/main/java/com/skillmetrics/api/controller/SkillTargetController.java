package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillTargetDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillTargetService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/skill-targets")
@RequiredArgsConstructor
public class SkillTargetController {

    private final SkillTargetService skillTargetService;

    /**
     * Get all skill targets
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SkillTargetDto>> getAllSkillTargets() {
        return ResponseEntity.ok(skillTargetService.getAllSkillTargets());
    }

    /**
     * Get skill targets by user ID
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getSkillTargetsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserId(userId));
    }

    /**
     * Get skill targets for the current user
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTargetDto>> getCurrentUserSkillTargets(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserId(currentUser.getId()));
    }

    /**
     * Get skill targets by status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SkillTargetDto>> getSkillTargetsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByStatus(status));
    }

    /**
     * Get skill targets by user ID and status
     */
    @GetMapping("/user/{userId}/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getSkillTargetsByUserIdAndStatus(
            @PathVariable Long userId, @PathVariable String status) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserIdAndStatus(userId, status));
    }

    /**
     * Get current user's skill targets by status
     */
    @GetMapping("/me/status/{status}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTargetDto>> getCurrentUserSkillTargetsByStatus(
            @PathVariable String status, @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetsByUserIdAndStatus(currentUser.getId(), status));
    }

    /**
     * Get a skill target by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @skillTargetService.getSkillTargetById(#id).userId == authentication.principal.id")
    public ResponseEntity<SkillTargetDto> getSkillTargetById(@PathVariable Long id) {
        return ResponseEntity.ok(skillTargetService.getSkillTargetById(id));
    }

    /**
     * Create a new skill target
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #skillTargetDto.userId == authentication.principal.id")
    public ResponseEntity<SkillTargetDto> createSkillTarget(@Valid @RequestBody SkillTargetDto skillTargetDto) {
        return ResponseEntity.ok(skillTargetService.createSkillTarget(skillTargetDto));
    }

    /**
     * Create a skill target for the current user
     */
    @PostMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillTargetDto> createCurrentUserSkillTarget(
            @Valid @RequestBody SkillTargetDto skillTargetDto,
            @CurrentUser UserPrincipal currentUser) {
        
        skillTargetDto.setUserId(currentUser.getId());
        return ResponseEntity.ok(skillTargetService.createSkillTarget(skillTargetDto));
    }

    /**
     * Update a skill target
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @skillTargetService.getSkillTargetById(#id).userId == authentication.principal.id")
    public ResponseEntity<SkillTargetDto> updateSkillTarget(
            @PathVariable Long id, @Valid @RequestBody SkillTargetDto skillTargetDto) {
        return ResponseEntity.ok(skillTargetService.updateSkillTarget(id, skillTargetDto));
    }

    /**
     * Delete a skill target
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or @skillTargetService.getSkillTargetById(#id).userId == authentication.principal.id")
    public ResponseEntity<Map<String, Boolean>> deleteSkillTarget(@PathVariable Long id) {
        skillTargetService.deleteSkillTarget(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    /**
     * Get expired skill targets for a user
     */
    @GetMapping("/user/{userId}/expired")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getExpiredTargetsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(skillTargetService.getExpiredTargetsForUser(userId));
    }

    /**
     * Get current user's expired skill targets
     */
    @GetMapping("/me/expired")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTargetDto>> getCurrentUserExpiredTargets(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getExpiredTargetsForUser(currentUser.getId()));
    }

    /**
     * Get skill targets by date range
     */
    @GetMapping("/user/{userId}/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<SkillTargetDto>> getTargetsInDateRange(
            @PathVariable Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(skillTargetService.getTargetsInDateRange(userId, startDate, endDate));
    }

    /**
     * Get current user's skill targets by date range
     */
    @GetMapping("/me/date-range")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillTargetDto>> getCurrentUserTargetsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillTargetService.getTargetsInDateRange(currentUser.getId(), startDate, endDate));
    }
}