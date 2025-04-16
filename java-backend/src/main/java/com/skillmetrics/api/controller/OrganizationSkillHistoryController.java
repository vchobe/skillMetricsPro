package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillHistoryDto;
import com.skillmetrics.api.service.OrganizationSkillHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Controller for organization-wide skill history tracking.
 * Provides endpoints to analyze historical skill data across the organization.
 */
@RestController
@RequestMapping("/api/org/skills/history")
@RequiredArgsConstructor
public class OrganizationSkillHistoryController {

    private final OrganizationSkillHistoryService organizationSkillHistoryService;

    /**
     * Get organization skill history summary
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getOrganizationSkillHistorySummary() {
        return ResponseEntity.ok(organizationSkillHistoryService.getOrganizationSkillHistorySummary());
    }

    /**
     * Get skill history for a specific time period
     */
    @GetMapping("/period")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getSkillHistoryByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillHistoryByPeriod(startDate, endDate));
    }

    /**
     * Get skill history for a specific category
     */
    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getSkillHistoryByCategory(@PathVariable String category) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillHistoryByCategory(category));
    }

    /**
     * Get skill history for a specific skill
     */
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillHistoryDto>> getSkillHistoryBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillHistoryBySkillId(skillId));
    }

    /**
     * Get skill history trend data
     */
    @GetMapping("/trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillHistoryTrends(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillHistoryTrends(startDate, endDate, category));
    }

    /**
     * Get skill growth rate by category
     */
    @GetMapping("/growth-rate/category")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillGrowthRateByCategory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillGrowthRateByCategory(startDate, endDate));
    }

    /**
     * Get skill level improvement history
     */
    @GetMapping("/level-improvements")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillLevelImprovementHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillLevelImprovementHistory(startDate, endDate));
    }

    /**
     * Get monthly skill acquisition statistics
     */
    @GetMapping("/monthly-stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getMonthlySkillAcquisitionStats(
            @RequestParam(defaultValue = "12") int months) {
        return ResponseEntity.ok(organizationSkillHistoryService.getMonthlySkillAcquisitionStats(months));
    }

    /**
     * Get department-based skill history comparison
     */
    @GetMapping("/department-comparison")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getDepartmentSkillHistoryComparison(
            @RequestParam List<String> departments,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(organizationSkillHistoryService.getDepartmentSkillHistoryComparison(departments, startDate, endDate));
    }

    /**
     * Get skill deprecation analysis (skills that are becoming obsolete)
     */
    @GetMapping("/skill-deprecation")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillDeprecationAnalysis() {
        return ResponseEntity.ok(organizationSkillHistoryService.getSkillDeprecationAnalysis());
    }

    /**
     * Get visualization data for a specific history metric
     */
    @GetMapping("/visualization/{metricType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getVisualizationData(
            @PathVariable String metricType,
            @RequestParam(required = false) Map<String, String> parameters) {
        return ResponseEntity.ok(organizationSkillHistoryService.getVisualizationData(metricType, parameters));
    }
}