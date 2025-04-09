package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.model.enums.SkillLevel;
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

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<Map<String, Object>> searchAll(@RequestParam String term) {
        return ResponseEntity.ok(searchService.searchAll(term));
    }
    
    @GetMapping("/users/skill")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<UserDto>> findUsersBySkill(@RequestParam String skillName) {
        return ResponseEntity.ok(searchService.findUsersBySkill(skillName));
    }
    
    @GetMapping("/users/skill/level")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<UserDto>> findUsersBySkillAndLevel(
            @RequestParam String skillName, @RequestParam SkillLevel level) {
        return ResponseEntity.ok(searchService.findUsersBySkillAndLevel(skillName, level));
    }
    
    @GetMapping("/projects/skill")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> findProjectsBySkill(@RequestParam String skillName) {
        return ResponseEntity.ok(searchService.findProjectsBySkill(skillName));
    }
    
    @GetMapping("/skills/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<SkillDto>> findMatchingSkillsForProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(searchService.findMatchingSkillsForProject(projectId));
    }
    
    @GetMapping("/team/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<UserDto>> findPotentialTeamMembersForProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(searchService.findPotentialTeamMembersForProject(projectId));
    }
}
