package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillGapDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillGapAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for skill gap analysis operations.
 * Provides endpoints to analyze skill gaps at individual, team, and organizational levels.
 */
@RestController
@RequestMapping("/api/skill-gap-analysis")
@RequiredArgsConstructor
public class SkillGapAnalysisController {

    private final SkillGapAnalysisService skillGapAnalysisService;

    /**
     * Get skill gap analysis for a project
     */
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getProjectSkillGapAnalysis(@PathVariable Long projectId) {
        return ResponseEntity.ok(skillGapAnalysisService.getProjectSkillGapAnalysis(projectId));
    }

    /**
     * Get skill gap analysis for a user against target skills
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> getUserSkillGapAnalysis(@PathVariable Long userId) {
        return ResponseEntity.ok(skillGapAnalysisService.getUserSkillGapAnalysis(userId));
    }

    /**
     * Get skill gap analysis for the current user
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCurrentUserSkillGapAnalysis(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(skillGapAnalysisService.getUserSkillGapAnalysis(currentUser.getId()));
    }

    /**
     * Get skill gap analysis for the entire organization
     */
    @GetMapping("/organization")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getOrganizationSkillGapAnalysis() {
        return ResponseEntity.ok(skillGapAnalysisService.getOrganizationSkillGapAnalysis());
    }

    /**
     * Get skill gap analysis by department
     */
    @GetMapping("/department/{department}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getDepartmentSkillGapAnalysis(@PathVariable String department) {
        return ResponseEntity.ok(skillGapAnalysisService.getDepartmentSkillGapAnalysis(department));
    }

    /**
     * Get consolidated skill gaps across all projects
     */
    @GetMapping("/projects/consolidated")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillGapDto>> getConsolidatedProjectSkillGaps() {
        return ResponseEntity.ok(skillGapAnalysisService.getConsolidatedProjectSkillGaps());
    }

    /**
     * Get skill gaps by category
     */
    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, List<SkillGapDto>>> getSkillGapsByCategory() {
        return ResponseEntity.ok(skillGapAnalysisService.getSkillGapsByCategory());
    }

    /**
     * Get critical skill gaps (high priority gaps)
     */
    @GetMapping("/critical")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillGapDto>> getCriticalSkillGaps() {
        return ResponseEntity.ok(skillGapAnalysisService.getCriticalSkillGaps());
    }

    /**
     * Get recommended training to address skill gaps
     */
    @GetMapping("/training-recommendations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getTrainingRecommendations() {
        return ResponseEntity.ok(skillGapAnalysisService.getTrainingRecommendations());
    }

    /**
     * Get project staffing recommendations based on skill gaps
     */
    @GetMapping("/staffing-recommendations/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getStaffingRecommendations(@PathVariable Long projectId) {
        return ResponseEntity.ok(skillGapAnalysisService.getStaffingRecommendations(projectId));
    }

    /**
     * Compare skill gaps between two projects
     */
    @GetMapping("/compare-projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> compareProjectSkillGaps(
            @RequestParam Long projectId1, 
            @RequestParam Long projectId2) {
        return ResponseEntity.ok(skillGapAnalysisService.compareProjectSkillGaps(projectId1, projectId2));
    }

    /**
     * Get skill gap trends over time
     */
    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillGapTrends(
            @RequestParam(defaultValue = "6") int monthsBack) {
        return ResponseEntity.ok(skillGapAnalysisService.getSkillGapTrends(monthsBack));
    }
}