package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.service.ProjectResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/project-resources")
@RequiredArgsConstructor
public class ProjectResourceController {

    private final ProjectResourceService projectResourceService;

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResourceDto> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(projectResourceService.getResourceById(id));
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> addResourceToProject(@Valid @RequestBody ProjectResourceDto resourceDto) {
        return new ResponseEntity<>(projectResourceService.addResourceToProject(resourceDto), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> updateProjectResource(
            @PathVariable Long id,
            @Valid @RequestBody ProjectResourceDto resourceDto) {
        return ResponseEntity.ok(projectResourceService.updateProjectResource(id, resourceDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> removeResourceFromProject(@PathVariable Long id) {
        projectResourceService.removeResourceFromProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
