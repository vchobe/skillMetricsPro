package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.dto.ProjectResourceHistoryDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.ProjectResourceHistoryService;
import com.skillmetrics.api.service.ProjectResourceService;
import com.skillmetrics.api.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserProjectController {
    
    private final ProjectService projectService;
    private final ProjectResourceService projectResourceService;
    private final ProjectResourceHistoryService projectResourceHistoryService;
    
    @GetMapping("/users/{userId}/projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<ProjectDto>> getUserProjects(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getProjectsByUserId(userId));
    }
    
    @GetMapping("/users/{userId}/projects/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<ProjectResourceHistoryDto>> getUserProjectHistory(@PathVariable Long userId) {
        return ResponseEntity.ok(projectResourceHistoryService.getHistoryByUserId(userId));
    }
    
    @GetMapping("/user/projects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectDto>> getCurrentUserProjects(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(projectService.getProjectsByUserId(currentUser.getId()));
    }
    
    @GetMapping("/user/projects/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectResourceHistoryDto>> getCurrentUserProjectHistory(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(projectResourceHistoryService.getHistoryByUserId(currentUser.getId()));
    }
    
    @GetMapping("/user/projects/current")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectDto>> getCurrentUserActiveProjects(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(projectService.getActiveProjectsByUserId(currentUser.getId()));
    }
    
    @GetMapping("/user/projects/resources")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectResourceDto>> getCurrentUserProjectResources(
            @CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(projectResourceService.getResourcesByUserId(currentUser.getId()));
    }
    
    @GetMapping("/users/{userId}/projects/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<List<ProjectResourceDto>> getUserProjectResources(@PathVariable Long userId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByUserId(userId));
    }
    
    @GetMapping("/users/{userId}/projects/summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<Map<String, Object>> getUserProjectsSummary(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getUserProjectsSummary(userId));
    }
}