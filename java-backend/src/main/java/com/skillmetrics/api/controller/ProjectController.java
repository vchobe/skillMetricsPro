package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto projectDto) {
        return new ResponseEntity<>(projectService.createProject(projectDto), HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ProjectDto>> getProjectsByClientId(@PathVariable Long clientId) {
        return ResponseEntity.ok(projectService.getProjectsByClientId(clientId));
    }
    
    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<ProjectDto>> getProjectsByLeadId(@PathVariable Long leadId) {
        return ResponseEntity.ok(projectService.getProjectsByLeadId(leadId));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<ProjectDto>> getProjectsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }
    
    @GetMapping("/location/{location}")
    public ResponseEntity<List<ProjectDto>> getProjectsByLocation(@PathVariable String location) {
        return ResponseEntity.ok(projectService.getProjectsByLocation(location));
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<ProjectDto>> getActiveProjects() {
        return ResponseEntity.ok(projectService.getActiveProjects());
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ProjectDto>> searchProjectsByName(@RequestParam String keyword) {
        return ResponseEntity.ok(projectService.searchProjectsByName(keyword));
    }
}
