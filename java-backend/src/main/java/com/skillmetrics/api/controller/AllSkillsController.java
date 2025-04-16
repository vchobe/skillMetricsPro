package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.SkillSummaryDto;
import com.skillmetrics.api.service.SkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for consolidated access to skills data across the organization.
 * This controller complements the SkillController by providing dedicated endpoints
 * for retrieving aggregated skill data from various perspectives.
 */
@RestController
@RequestMapping("/api/all-skills")
@RequiredArgsConstructor
public class AllSkillsController {

    private final SkillService skillService;

    /**
     * Get all skills across all users
     */
    @GetMapping
    public ResponseEntity<List<SkillDto>> getAllSkills() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }

    /**
     * Get all skills with pagination
     */
    @GetMapping("/paginated")
    public ResponseEntity<Page<SkillDto>> getAllSkillsPaginated(
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(skillService.getAllSkillsPaginated(pageable));
    }

    /**
     * Get aggregated skill data by category
     */
    @GetMapping("/by-category")
    public ResponseEntity<Map<String, List<SkillDto>>> getSkillsByCategory() {
        return ResponseEntity.ok(skillService.getSkillsGroupedByCategory());
    }

    /**
     * Get aggregated skill data by level
     */
    @GetMapping("/by-level")
    public ResponseEntity<Map<String, List<SkillDto>>> getSkillsByLevel() {
        return ResponseEntity.ok(skillService.getSkillsGroupedByLevel());
    }

    /**
     * Get skill counts by category
     */
    @GetMapping("/counts/by-category")
    public ResponseEntity<Map<String, Integer>> getSkillCountsByCategory() {
        return ResponseEntity.ok(skillService.getSkillCountsByCategory());
    }

    /**
     * Get skill counts by level
     */
    @GetMapping("/counts/by-level")
    public ResponseEntity<Map<String, Integer>> getSkillCountsByLevel() {
        return ResponseEntity.ok(skillService.getSkillCountsByLevel());
    }

    /**
     * Get skill summary statistics
     */
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSkillSummary() {
        return ResponseEntity.ok(skillService.getSkillSummary());
    }

    /**
     * Get unique skill names across all users
     */
    @GetMapping("/unique-names")
    public ResponseEntity<List<String>> getUniqueSkillNames() {
        return ResponseEntity.ok(skillService.getUniqueSkillNames());
    }

    /**
     * Get skills with certification counts
     */
    @GetMapping("/certifications")
    public ResponseEntity<Map<String, Integer>> getSkillsWithCertificationCounts() {
        return ResponseEntity.ok(skillService.getSkillsWithCertificationCounts());
    }

    /**
     * Get all skill data for organization with detailed user information
     */
    @GetMapping("/organization-detail")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillSummaryDto>> getOrganizationSkillDetail() {
        return ResponseEntity.ok(skillService.getOrganizationSkillDetail());
    }

    /**
     * Get skills matrix (skills vs. users)
     */
    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillsMatrix() {
        return ResponseEntity.ok(skillService.getSkillsMatrix());
    }

    /**
     * Get aggregated skill data for reporting
     */
    @GetMapping("/reporting")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillsForReporting() {
        return ResponseEntity.ok(skillService.getSkillsForReporting());
    }

    /**
     * Get skills with advanced filters
     */
    @PostMapping("/filtered")
    public ResponseEntity<List<SkillDto>> getFilteredSkills(
            @RequestBody Map<String, Object> filters) {
        return ResponseEntity.ok(skillService.getFilteredSkills(filters));
    }
}