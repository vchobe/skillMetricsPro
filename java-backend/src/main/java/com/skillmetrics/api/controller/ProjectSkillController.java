package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.service.ProjectSkillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-skills")
@RequiredArgsConstructor
public class ProjectSkillController {
    
    private final ProjectSkillService projectSkillService;
    
    @GetMapping
    public ResponseEntity<List<ProjectSkillDto>> getAllProjectSkills() {
        return ResponseEntity.ok(projectSkillService.getAllProjectSkills());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProjectSkillDto> getProjectSkillById(@PathVariable Long id) {
        return ResponseEntity.ok(projectSkillService.getProjectSkillById(id));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectSkillDto>> getSkillsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectSkillService.getSkillsByProjectId(projectId));
    }
    
    @PostMapping
    public ResponseEntity<ProjectSkillDto> addSkillToProject(@RequestBody ProjectSkillDto projectSkillDto) {
        return new ResponseEntity<>(
            projectSkillService.addSkillToProject(projectSkillDto),
            HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProjectSkillDto> updateProjectSkill(
            @PathVariable Long id,
            @RequestBody ProjectSkillDto projectSkillDto) {
        return ResponseEntity.ok(projectSkillService.updateProjectSkill(id, projectSkillDto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProjectSkill(@PathVariable Long id) {
        projectSkillService.deleteProjectSkill(id);
        return ResponseEntity.noContent().build();
    }
    
    @DeleteMapping("/project/{projectId}/skill/{skillId}")
    public ResponseEntity<Void> removeSkillFromProject(
            @PathVariable Long projectId,
            @PathVariable Long skillId) {
        projectSkillService.removeSkillFromProject(projectId, skillId);
        return ResponseEntity.noContent().build();
    }
}
