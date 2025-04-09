package com.skillmetrics.api.controller;

import com.skillmetrics.api.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }
    
    @GetMapping("/skills/distribution/level")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Integer>> getSkillDistributionByLevel() {
        return ResponseEntity.ok(analyticsService.getSkillDistributionByLevel());
    }
    
    @GetMapping("/skills/distribution/category")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Integer>> getSkillDistributionByCategory() {
        return ResponseEntity.ok(analyticsService.getSkillDistributionByCategory());
    }
    
    @GetMapping("/projects/distribution/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Integer>> getProjectDistributionByStatus() {
        return ResponseEntity.ok(analyticsService.getProjectDistributionByStatus());
    }
    
    @GetMapping("/skills/avg-per-user")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Double>> getAverageSkillsPerUser() {
        return ResponseEntity.ok(analyticsService.getAverageSkillsPerUser());
    }
    
    @GetMapping("/skills/top-categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Integer>> getTopSkillCategories(
            @RequestParam(name = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getTopSkillCategories(limit));
    }
    
    @GetMapping("/advanced")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getAdvancedAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getAdvancedAnalytics(startDate, endDate));
    }
    
    @GetMapping("/certifications/report")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getCertificationReport() {
        return ResponseEntity.ok(analyticsService.getCertificationReport());
    }
    
    @GetMapping("/skills/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillHistoryAnalytics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getSkillHistoryAnalytics(startDate, endDate));
    }
    
    @GetMapping("/users/progress")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> getUserProgressAnalytics() {
        return ResponseEntity.ok(analyticsService.getUserProgressAnalytics());
    }
    
    @GetMapping("/skills/growth-trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillGrowthTrend(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getSkillGrowthTrend(startDate, endDate));
    }
    
    @GetMapping("/endorsements/trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getEndorsementsTrend() {
        return ResponseEntity.ok(analyticsService.getEndorsementsTrend());
    }
    
    @GetMapping("/projects/skill-demand")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getProjectSkillDemand() {
        return ResponseEntity.ok(analyticsService.getProjectSkillDemand());
    }
    
    @GetMapping("/organization/skill-history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getOrganizationSkillHistory(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(analyticsService.getOrganizationSkillHistory(startDate, endDate));
    }
}