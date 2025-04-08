package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.service.ProjectSkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-skills")
@RequiredArgsConstructor
public class ProjectSkillController {

    private final ProjectSkillService projectSkillService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getAllProjectSkills() {
        return ResponseEntity.ok(projectSkillService.getAllProjectSkills());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<ProjectSkillDto> getProjectSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillById(id));
    }
    
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getSkillsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectSkillService.getSkillsByProjectId(projectId));
    }
    
    @GetMapping("/skill/{skillId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getProjectsBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(projectSkillService.getProjectsBySkillId(skillId));
    }
    
    @GetMapping("/required-level/{requiredLevel}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getProjectSkillsByRequiredLevel(@PathVariable String requiredLevel) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillsByRequiredLevel(requiredLevel));
    }
    
    @GetMapping("/skill-category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getProjectSkillsBySkillCategory(@PathVariable String category) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillsBySkillCategory(category));
    }
    
    @GetMapping("/search/project-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> searchProjectSkillsByProjectName(@RequestParam String keyword) {
        return ResponseEntity.ok(projectSkillService.searchProjectSkillsByProjectName(keyword));
    }
    
    @GetMapping("/search/skill-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> searchProjectSkillsBySkillName(@RequestParam String keyword) {
        return ResponseEntity.ok(projectSkillService.searchProjectSkillsBySkillName(keyword));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectSkillDto> createProjectSkill(@Valid @RequestBody ProjectSkillDto projectSkillDto) {
        return ResponseEntity.ok(projectSkillService.createProjectSkill(projectSkillDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectSkillDto> updateProjectSkill(
            @PathVariable Long id, 
            @Valid @RequestBody ProjectSkillDto projectSkillDto) {
        return ResponseEntity.ok(projectSkillService.updateProjectSkill(id, projectSkillDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteProjectSkill(@PathVariable Long id) {
        projectSkillService.deleteProjectSkill(id);
        return ResponseEntity.noContent().build();
    }
}
