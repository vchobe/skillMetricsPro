package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.*;
import com.skillmetrics.api.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Search for skills
     */
    @GetMapping("/skills")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SkillDto>> searchSkills(
            @RequestParam String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.searchSkills(query, category, level, userId, page, size));
    }

    /**
     * Search for users
     */
    @GetMapping("/users")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserDto>> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String location,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.searchUsers(query, role, location, page, size));
    }

    /**
     * Search for projects
     */
    @GetMapping("/projects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectDto>> searchProjects(
            @RequestParam String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long clientId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.searchProjects(query, status, clientId, page, size));
    }

    /**
     * Search for users by skill
     */
    @GetMapping("/users/by-skill")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<UserDto>> searchUsersBySkill(
            @RequestParam String skillName,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.searchUsersBySkill(skillName, category, level, page, size));
    }

    /**
     * Find skill gaps for a project
     */
    @GetMapping("/projects/{projectId}/skill-gaps")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> findProjectSkillGaps(@PathVariable Long projectId) {
        return ResponseEntity.ok(searchService.findProjectSkillGaps(projectId));
    }

    /**
     * Find users with skills matching project requirements
     */
    @GetMapping("/projects/{projectId}/matching-users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserDto>> findUsersMatchingProjectSkills(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.findUsersMatchingProjectSkills(projectId, page, size));
    }

    /**
     * Search for all entities (skills, users, projects)
     */
    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> searchAllEntities(
            @RequestParam String query,
            @RequestParam(defaultValue = "5") int limit) {
        
        return ResponseEntity.ok(searchService.searchAllEntities(query, limit));
    }

    /**
     * Autocomplete search
     */
    @GetMapping("/autocomplete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> autocompleteSearch(
            @RequestParam String query,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "10") int limit) {
        
        return ResponseEntity.ok(searchService.autocompleteSearch(query, type, limit));
    }

    /**
     * Advanced search
     */
    @PostMapping("/advanced")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> advancedSearch(
            @RequestBody Map<String, Object> searchCriteria,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        return ResponseEntity.ok(searchService.advancedSearch(searchCriteria, page, size));
    }
}