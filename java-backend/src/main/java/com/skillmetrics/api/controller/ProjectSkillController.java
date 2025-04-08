package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.service.ProjectSkillService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-skills")
@RequiredArgsConstructor
public class ProjectSkillController {

    private final ProjectSkillService projectSkillService;

    @GetMapping("/{id}")
    public ResponseEntity<ProjectSkillDto> getProjectSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillById(id));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectSkillDto>> getSkillsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectSkillService.getSkillsByProjectId(projectId));
    }
    
    @GetMapping("/skill/{skillId}")
    public ResponseEntity<List<ProjectSkillDto>> getProjectsBySkillId(@PathVariable Long skillId) {
        return ResponseEntity.ok(projectSkillService.getProjectsBySkillId(skillId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectSkillDto> addSkillToProject(@Valid @RequestBody ProjectSkillDto projectSkillDto) {
        return new ResponseEntity<>(projectSkillService.addSkillToProject(projectSkillDto), HttpStatus.CREATED);
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
    public ResponseEntity<Void> removeSkillFromProject(@PathVariable Long id) {
        projectSkillService.removeSkillFromProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/level/{requiredLevel}")
    public ResponseEntity<List<ProjectSkillDto>> getProjectSkillsByRequiredLevel(@PathVariable String requiredLevel) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillsByRequiredLevel(requiredLevel));
    }
}
