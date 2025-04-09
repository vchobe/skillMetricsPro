package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ResourceDto;
import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ResourceDto>> getResourcesByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceService.getResourcesByProjectId(projectId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ResourceDto>> getResourcesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceService.getResourcesByUserId(userId));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ResourceDto> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }
    
    @GetMapping("/current/user/{userId}")
    public ResponseEntity<List<ResourceDto>> getCurrentResourcesForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceService.getCurrentResourcesForUser(userId));
    }
    
    @GetMapping("/current/project/{projectId}")
    public ResponseEntity<List<ResourceDto>> getCurrentResourcesForProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceService.getCurrentResourcesForProject(projectId));
    }
    
    @GetMapping("/allocation/user/{userId}")
    public ResponseEntity<Integer> calculateUserTotalAllocation(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceService.calculateUserTotalAllocation(userId));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ResourceDto> addResourceToProject(
            @Valid @RequestBody ResourceDto resourceDto,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resourceService.addResourceToProject(resourceDto, currentUser.getId()));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<ResourceDto> updateResource(
            @PathVariable Long id,
            @Valid @RequestBody ResourceDto resourceDto,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.ok(resourceService.updateResource(id, resourceDto, currentUser.getId()));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    public ResponseEntity<Void> removeResource(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        resourceService.removeResource(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/history/project/{projectId}")
    public ResponseEntity<List<ResourceHistoryDto>> getResourceHistoryByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceService.getResourceHistoryByProjectId(projectId));
    }
    
    @GetMapping("/history/user/{userId}")
    public ResponseEntity<List<ResourceHistoryDto>> getResourceHistoryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceService.getResourceHistoryByUserId(userId));
    }
    
    @GetMapping("/history/resource/{resourceId}")
    public ResponseEntity<List<ResourceHistoryDto>> getResourceHistoryByResourceId(@PathVariable Long resourceId) {
        return ResponseEntity.ok(resourceService.getResourceHistoryByResourceId(resourceId));
    }
}
