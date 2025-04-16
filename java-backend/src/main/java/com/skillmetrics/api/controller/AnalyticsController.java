package com.skillmetrics.api.controller;

import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller for providing analytical data and insights.
 * Handles various analytics requests for skills, projects, users, and certifications.
 */
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
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
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
    
    /**
     * Get advanced analytics dashboard data
     * Combines multiple analytics endpoints for an executive dashboard
     */
    @GetMapping("/admin/advanced-analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdvancedAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getAdvancedAnalytics(startDate, endDate));
    }
    
    /**
     * Get skill forecasting and prediction analysis
     * Provides predictive analytics for future skill needs
     */
    @GetMapping("/skills/forecast")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillForecast(
            @RequestParam(defaultValue = "6") int monthsAhead) {
        return ResponseEntity.ok(analyticsService.getSkillForecast(monthsAhead));
    }
    
    /**
     * Get team skills comparative analysis
     * Compare skills across different teams or departments
     */
    @GetMapping("/teams/comparison")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getTeamSkillsComparison(
            @RequestParam(required = false) List<String> teamIds) {
        return ResponseEntity.ok(analyticsService.getTeamSkillsComparison(teamIds));
    }
    
    /**
     * Get certification analytics report
     */
    @GetMapping("/admin/certification-report")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCertificationReport() {
        return ResponseEntity.ok(analyticsService.getCertificationReport());
    }
    
    /**
     * Get certification expiration analysis
     * Identifies upcoming certification expirations
     */
    @GetMapping("/certifications/expiring")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getExpiringCertifications(
            @RequestParam(defaultValue = "90") int daysAhead) {
        return ResponseEntity.ok(analyticsService.getExpiringCertifications(daysAhead));
    }
    
    /**
     * Get skill acquisition rate analysis
     * Analyzes how quickly users are acquiring new skills
     */
    @GetMapping("/skills/acquisition-rate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillAcquisitionRate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getSkillAcquisitionRate(startDate, endDate));
    }
    
    /**
     * Get skill utilization analysis in projects
     * Analyzes how effectively skills are being utilized in projects
     */
    @GetMapping("/skills/utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillUtilization() {
        return ResponseEntity.ok(analyticsService.getSkillUtilization());
    }

    /**
     * Get detailed user performance metrics
     */
    @GetMapping("/users/{userId}/performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> getUserPerformanceMetrics(
            @PathVariable Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getUserPerformanceMetrics(userId, startDate, endDate));
    }
    
    /**
     * Get visualization data for a specific analytics report
     */
    @GetMapping("/visualization/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getVisualizationData(
            @PathVariable String reportType,
            @RequestParam(required = false) Map<String, String> parameters) {
        return ResponseEntity.ok(analyticsService.getVisualizationData(reportType, parameters));
    }
}