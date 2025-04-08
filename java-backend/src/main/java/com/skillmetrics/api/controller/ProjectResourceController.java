package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.model.ResourceHistory;
import com.skillmetrics.api.service.ProjectResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-resources")
@RequiredArgsConstructor
public class ProjectResourceController {
    
    private final ProjectResourceService projectResourceService;
    
    @GetMapping
    public ResponseEntity<List<ProjectResourceDto>> getAllProjectResources() {
        return ResponseEntity.ok(projectResourceService.getAllProjectResources());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResourceDto> getProjectResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(projectResourceService.getProjectResourceById(id));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByProjectId(projectId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByUserId(userId));
    }
    
    @PostMapping
    public ResponseEntity<ProjectResourceDto> addResourceToProject(
            @RequestBody ProjectResourceDto resourceDto,
            @RequestParam Long performedById) {
        return new ResponseEntity<>(
            projectResourceService.addResourceToProject(resourceDto, performedById),
            HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResourceDto> updateProjectResource(
            @PathVariable Long id,
            @RequestBody ProjectResourceDto resourceDto,
            @RequestParam Long performedById) {
        return ResponseEntity.ok(
            projectResourceService.updateProjectResource(id, resourceDto, performedById));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeResourceFromProject(
            @PathVariable Long id,
            @RequestParam Long performedById,
            @RequestParam(required = false) String note) {
        projectResourceService.removeResourceFromProject(id, performedById, note);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/history/project/{projectId}")
    public ResponseEntity<List<ResourceHistory>> getResourceHistoryByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectResourceService.getResourceHistoryByProjectId(projectId));
    }
}
