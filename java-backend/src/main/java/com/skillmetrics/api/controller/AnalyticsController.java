package com.skillmetrics.api.controller;

import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get overview of system analytics
     */
    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getOverviewAnalytics() {
        return ResponseEntity.ok(analyticsService.getOverviewAnalytics());
    }

    /**
     * Get skill distribution by category
     */
    @GetMapping("/skills/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillDistributionByCategory() {
        return ResponseEntity.ok(analyticsService.getSkillDistributionByCategory());
    }

    /**
     * Get skill distribution by level
     */
    @GetMapping("/skills/levels")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillDistributionByLevel() {
        return ResponseEntity.ok(analyticsService.getSkillDistributionByLevel());
    }

    /**
     * Get skill growth over time
     */
    @GetMapping("/skills/growth")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillGrowthOverTime(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getSkillGrowthOverTime(startDate, endDate));
    }

    /**
     * Get top skills by user count
     */
    @GetMapping("/skills/top")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getTopSkills(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(analyticsService.getTopSkills(limit));
    }

    /**
     * Get skill gap analysis (skills needed vs. available)
     */
    @GetMapping("/skills/gaps")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillGapAnalysis() {
        return ResponseEntity.ok(analyticsService.getSkillGapAnalysis());
    }

    /**
     * Get project resource allocation statistics
     */
    @GetMapping("/projects/allocation")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getProjectAllocationStats() {
        return ResponseEntity.ok(analyticsService.getProjectAllocationStats());
    }

    /**
     * Get user skill development analytics
     */
    @GetMapping("/users/{userId}/development")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> getUserDevelopmentAnalytics(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getUserDevelopmentAnalytics(userId));
    }

    /**
     * Get current user's skill development analytics
     */
    @GetMapping("/me/development")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCurrentUserDevelopmentAnalytics(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(analyticsService.getUserDevelopmentAnalytics(currentUser.getId()));
    }

    /**
     * Get skill endorsement statistics
     */
    @GetMapping("/endorsements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getEndorsementStatistics() {
        return ResponseEntity.ok(analyticsService.getEndorsementStatistics());
    }

    /**
     * Get project completion statistics
     */
    @GetMapping("/projects/completion")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getProjectCompletionStats() {
        return ResponseEntity.ok(analyticsService.getProjectCompletionStats());
    }

    /**
     * Get skill category comparison by project
     */
    @GetMapping("/projects/{projectId}/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getProjectSkillCategoryComparison(@PathVariable Long projectId) {
        return ResponseEntity.ok(analyticsService.getProjectSkillCategoryComparison(projectId));
    }
}