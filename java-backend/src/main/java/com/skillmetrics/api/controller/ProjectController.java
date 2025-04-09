package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.dto.ProjectSkillDto;
import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<ProjectDto> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }
    
    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getProjectsByClientId(@PathVariable Long clientId) {
        return ResponseEntity.ok(projectService.getProjectsByClientId(clientId));
    }
    
    @GetMapping("/lead/{leadId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getProjectsByLeadId(@PathVariable Long leadId) {
        return ResponseEntity.ok(projectService.getProjectsByLeadId(leadId));
    }
    
    @GetMapping("/delivery-lead/{deliveryLeadId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getProjectsByDeliveryLeadId(@PathVariable Long deliveryLeadId) {
        return ResponseEntity.ok(projectService.getProjectsByDeliveryLeadId(deliveryLeadId));
    }
    
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getProjectsByStatus(@PathVariable String status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }
    
    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> getActiveProjects() {
        return ResponseEntity.ok(projectService.getActiveProjects());
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectDto>> searchProjects(@RequestParam String term) {
        return ResponseEntity.ok(projectService.searchProjects(term));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectDto> createProject(@Valid @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.createProject(projectDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectDto> updateProject(
            @PathVariable Long id, @Valid @RequestBody ProjectDto projectDto) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
    
    // Resources endpoints
    
    @GetMapping("/{projectId}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getProjectResources(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getResourcesByProjectId(projectId));
    }
    
    @PostMapping("/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> addResourceToProject(
            @Valid @RequestBody ProjectResourceDto resourceDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Get current user id from userDetails, or null if not available
        Long currentUserId = null;
        try {
            currentUserId = Long.parseLong(userDetails.getUsername());
        } catch (Exception e) {
            // If we can't get the user ID, proceed with null
        }
        
        return ResponseEntity.ok(projectService.addResourceToProject(resourceDto, currentUserId));
    }
    
    @PutMapping("/resources/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ProjectResourceDto resourceDto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Get current user id from userDetails, or null if not available
        Long currentUserId = null;
        try {
            currentUserId = Long.parseLong(userDetails.getUsername());
        } catch (Exception e) {
            // If we can't get the user ID, proceed with null
        }
        
        return ResponseEntity.ok(projectService.updateResource(id, resourceDto, currentUserId));
    }
    
    @DeleteMapping("/resources/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> removeResource(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Get current user id from userDetails, or null if not available
        Long currentUserId = null;
        try {
            currentUserId = Long.parseLong(userDetails.getUsername());
        } catch (Exception e) {
            // If we can't get the user ID, proceed with null
        }
        
        projectService.removeResource(id, currentUserId);
        return ResponseEntity.noContent().build();
    }
    
    // Skills endpoints
    
    @GetMapping("/{projectId}/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectSkillDto>> getProjectSkills(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getSkillsByProjectId(projectId));
    }
    
    @PostMapping("/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectSkillDto> addSkillToProject(@Valid @RequestBody ProjectSkillDto skillDto) {
        return ResponseEntity.ok(projectService.addSkillToProject(skillDto));
    }
    
    @PutMapping("/skills/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectSkillDto> updateProjectSkill(
            @PathVariable Long id, @Valid @RequestBody ProjectSkillDto skillDto) {
        return ResponseEntity.ok(projectService.updateProjectSkill(id, skillDto));
    }
    
    @DeleteMapping("/skills/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> removeSkillFromProject(@PathVariable Long id) {
        projectService.removeSkillFromProject(id);
        return ResponseEntity.noContent().build();
    }
    
    // Resource history endpoints
    
    @GetMapping("/{projectId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getResourceHistory(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getResourceHistoryByProjectId(projectId));
    }
}
