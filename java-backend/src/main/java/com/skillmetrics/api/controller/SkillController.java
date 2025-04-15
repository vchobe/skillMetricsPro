package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.EndorsementDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.SkillTemplateDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.SkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for skill-related operations.
 * Handles skill creation, retrieval, updates, and endorsements.
 */
@RestController
@RequestMapping("/api/skills")
@RequiredArgsConstructor
public class SkillController {

    private final SkillService skillService;

    /**
     * Get all skills with pagination
     */
    @GetMapping
    public ResponseEntity<List<SkillDto>> getAllSkills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(skillService.getAllSkills(page, size));
    }
    
    /**
     * Get all skills (unpaginated)
     * This endpoint is provided for compatibility and performance 
     * Note: Should be used with caution for large data sets
     */
    @GetMapping("/all")
    public ResponseEntity<List<SkillDto>> getAllSkillsUnpaginated() {
        return ResponseEntity.ok(skillService.getAllSkills());
    }
    
    /**
     * Get skill by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<SkillDto> getSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(skillService.getSkillById(id));
    }
    
    /**
     * Get skills by user ID
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(skillService.getSkillsByUserId(userId));
    }
    
    /**
     * Get skills by user ID and category
     */
    @GetMapping("/user/{userId}/category/{category}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserIdAndCategory(
            @PathVariable Long userId, 
            @PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByUserIdAndCategory(userId, category));
    }
    
    /**
     * Get skills by user ID and level
     */
    @GetMapping("/user/{userId}/level/{level}")
    public ResponseEntity<List<SkillDto>> getSkillsByUserIdAndLevel(
            @PathVariable Long userId, 
            @PathVariable String level) {
        return ResponseEntity.ok(skillService.getSkillsByUserIdAndLevel(userId, level));
    }
    
    /**
     * Get all skill categories
     */
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        return ResponseEntity.ok(skillService.getAllCategories());
    }
    
    /**
     * Get all skill levels
     */
    @GetMapping("/levels")
    public ResponseEntity<List<String>> getAllLevels() {
        return ResponseEntity.ok(skillService.getAllLevels());
    }
    
    /**
     * Search for skills by user ID
     */
    @GetMapping("/search/user/{userId}")
    public ResponseEntity<List<SkillDto>> searchUserSkills(
            @PathVariable Long userId, 
            @RequestParam String term) {
        return ResponseEntity.ok(skillService.searchUserSkills(userId, term));
    }
    
    /**
     * Search for skills (global)
     */
    @GetMapping("/search")
    public ResponseEntity<List<SkillDto>> searchSkills(@RequestParam String term) {
        return ResponseEntity.ok(skillService.searchSkills(term));
    }
    
    /**
     * Get top endorsed skills
     */
    @GetMapping("/top-endorsed")
    public ResponseEntity<List<SkillDto>> getTopEndorsedSkills(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(skillService.getTopEndorsedSkills(limit));
    }
    
    /**
     * Create a new skill
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillDto> createSkill(
            @Valid @RequestBody SkillDto skillDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // If userId is not explicitly set, use the current user's ID
        if (skillDto.getUserId() == null) {
            skillDto.setUserId(currentUser.getId());
        }
        
        // Only users with admin role can create skills for other users
        if (!currentUser.getId().equals(skillDto.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.createSkill(skillDto));
    }
    
    /**
     * Update a skill
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillDto> updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody SkillDto skillDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // Get the skill to check ownership
        SkillDto existingSkill = skillService.getSkillById(id);
        
        // Only the skill owner or admin can update the skill
        if (!currentUser.getId().equals(existingSkill.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(skillService.updateSkill(id, skillDto));
    }
    
    /**
     * Delete a skill
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteSkill(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        // Get the skill to check ownership
        SkillDto existingSkill = skillService.getSkillById(id);
        
        // Only the skill owner or admin can delete the skill
        if (!currentUser.getId().equals(existingSkill.getUserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        skillService.deleteSkill(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get skills by category
     */
    @GetMapping("/by-category/{category}")
    public ResponseEntity<List<SkillDto>> getSkillsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(skillService.getSkillsByCategory(category));
    }
    
    /**
     * Get skills by level
     */
    @GetMapping("/by-level/{level}")
    public ResponseEntity<List<SkillDto>> getSkillsByLevel(@PathVariable String level) {
        return ResponseEntity.ok(skillService.getSkillsByLevel(level));
    }
    
    /**
     * Get skills with certifications
     */
    @GetMapping("/with-certifications")
    public ResponseEntity<List<SkillDto>> getSkillsWithCertifications() {
        return ResponseEntity.ok(skillService.getSkillsWithCertifications());
    }
    
    /**
     * Get skills summary statistics
     */
    @GetMapping("/summary-statistics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillsSummaryStatistics() {
        return ResponseEntity.ok(skillService.getSkillsSummaryStatistics());
    }
    
    /**
     * Get skills distribution
     */
    @GetMapping("/distribution")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> getSkillsDistribution() {
        return ResponseEntity.ok(skillService.getSkillsDistribution());
    }
    
    /**
     * Get recently added skills
     */
    @GetMapping("/recent")
    public ResponseEntity<List<SkillDto>> getRecentlyAddedSkills(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(skillService.getRecentlyAddedSkills(limit));
    }
    
    /**
     * Get skill templates
     */
    @GetMapping("/templates")
    public ResponseEntity<List<SkillTemplateDto>> getSkillTemplates() {
        return ResponseEntity.ok(skillService.getSkillTemplates());
    }
    
    /**
     * Create skill from template
     */
    @PostMapping("/from-template/{templateId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<SkillDto> createSkillFromTemplate(
            @PathVariable Long templateId,
            @RequestParam(required = false) String level,
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(skillService.createSkillFromTemplate(templateId, level, currentUser.getId()));
    }
    
    // --- Global Skills API ---
    
    /**
     * New API endpoint to get all skills across all users (with filtering)
     * This endpoint is specifically implemented for frontend compatibility
     */
    @GetMapping("/global")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkillDto>> getAllGlobalSkills(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Boolean hasCertification) {
        return ResponseEntity.ok(skillService.getAllGlobalSkills(category, level, hasCertification));
    }
    
    /**
     * Get paginated global skills
     */
    @GetMapping("/global/paginated")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Page<SkillDto>> getPaginatedGlobalSkills(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            Pageable pageable) {
        return ResponseEntity.ok(skillService.getPaginatedGlobalSkills(category, level, pageable));
    }
    
    /**
     * Advanced search for skills with multiple criteria
     */
    @PostMapping("/advanced-search")
    public ResponseEntity<List<SkillDto>> advancedSkillSearch(
            @RequestBody Map<String, Object> searchCriteria) {
        return ResponseEntity.ok(skillService.advancedSkillSearch(searchCriteria));
    }
    
    // Endorsement endpoints
    
    /**
     * Create a skill endorsement
     */
    @PostMapping("/endorsements")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EndorsementDto> endorseSkill(
            @Valid @RequestBody EndorsementDto endorsementDto,
            @CurrentUser UserPrincipal currentUser) {
        
        // If endorserId is not explicitly set, use the current user's ID
        if (endorsementDto.getEndorserId() == null) {
            endorsementDto.setEndorserId(currentUser.getId());
        }
        
        // Only the current user or admin can create endorsements on behalf of the user
        if (!currentUser.getId().equals(endorsementDto.getEndorserId()) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.status(HttpStatus.CREATED).body(skillService.endorseSkill(endorsementDto));
    }
    
    /**
     * Delete an endorsement
     */
    @DeleteMapping("/endorsements/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> removeEndorsement(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        skillService.removeEndorsement(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get endorsements by skill ID
     */
    @GetMapping("/endorsements/skill/{skillId}")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(skillService.getEndorsementsBySkillId(skillId));
    }
    
    /**
     * Get endorsements by endorser ID
     */
    @GetMapping("/endorsements/user/{endorserId}")
    public ResponseEntity<List<EndorsementDto>> getEndorsementsByEndorserId(@PathVariable Long endorserId) {
        return ResponseEntity.ok(skillService.getEndorsementsByEndorserId(endorserId));
    }
}
