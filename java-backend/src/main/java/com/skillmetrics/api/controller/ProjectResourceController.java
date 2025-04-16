package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ProjectResourceDto;
import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.service.ProjectResourceService;
import com.skillmetrics.api.service.ResourceHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/project-resources")
@RequiredArgsConstructor
public class ProjectResourceController {

    private final ProjectResourceService projectResourceService;
    private final ResourceHistoryService resourceHistoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getAllProjectResources() {
        return ResponseEntity.ok(projectResourceService.getAllProjectResources());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<ProjectResourceDto> getProjectResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(projectResourceService.getProjectResourceById(id));
    }
    
    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByProjectId(projectId));
    }
    
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByUserId(userId));
    }
    
    @GetMapping("/project/{projectId}/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByProjectIdAndUserId(
            @PathVariable Long projectId, @PathVariable Long userId) {
        return ResponseEntity.ok(projectResourceService.getResourcesByProjectIdAndUserId(projectId, userId));
    }
    
    @GetMapping("/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByRole(@PathVariable String role) {
        return ResponseEntity.ok(projectResourceService.getResourcesByRole(role));
    }
    
    @GetMapping("/project/{projectId}/role/{role}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByProjectIdAndRole(
            @PathVariable Long projectId, @PathVariable String role) {
        return ResponseEntity.ok(projectResourceService.getResourcesByProjectIdAndRole(projectId, role));
    }
    
    @GetMapping("/starting-after")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesStartingAfter(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(projectResourceService.getResourcesStartingAfter(date));
    }
    
    @GetMapping("/ending-before")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesEndingBefore(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(projectResourceService.getResourcesEndingBefore(date));
    }
    
    @GetMapping("/active-at")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getActiveResourcesAtDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(projectResourceService.getActiveResourcesAtDate(date));
    }
    
    @GetMapping("/user/{userId}/minimum-allocation/{minimumAllocation}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> getResourcesByUserIdAndMinimumAllocation(
            @PathVariable Long userId, @PathVariable Integer minimumAllocation) {
        return ResponseEntity.ok(projectResourceService.getResourcesByUserIdAndMinimumAllocation(userId, minimumAllocation));
    }
    
    @GetMapping("/search/project-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> searchResourcesByProjectName(@RequestParam String keyword) {
        return ResponseEntity.ok(projectResourceService.searchResourcesByProjectName(keyword));
    }
    
    @GetMapping("/search/user-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ProjectResourceDto>> searchResourcesByUserName(@RequestParam String keyword) {
        return ResponseEntity.ok(projectResourceService.searchResourcesByUserName(keyword));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> createProjectResource(@Valid @RequestBody ProjectResourceDto projectResourceDto) {
        return ResponseEntity.ok(projectResourceService.createProjectResource(projectResourceDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResourceDto> updateProjectResource(
            @PathVariable Long id, 
            @Valid @RequestBody ProjectResourceDto projectResourceDto) {
        return ResponseEntity.ok(projectResourceService.updateProjectResource(id, projectResourceDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteProjectResource(@PathVariable Long id) {
        projectResourceService.deleteProjectResource(id);
        return ResponseEntity.noContent().build();
    }
    
    // Resource History Endpoints
    
    @GetMapping("/history/project/{projectId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByProjectId(projectId));
    }
    
    @GetMapping("/history/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByUserId(userId));
    }
    
    @GetMapping("/history/project/{projectId}/user/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByProjectIdAndUserId(
            @PathVariable Long projectId, @PathVariable Long userId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByProjectIdAndUserId(projectId, userId));
    }
    
    @GetMapping("/history/action/{action}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByAction(@PathVariable String action) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByAction(action));
    }
    
    @GetMapping("/history/performed-by/{performedById}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByPerformedById(@PathVariable Long performedById) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByPerformedById(performedById));
    }
    
    @GetMapping("/history/date-range")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByDateRange(startDate, endDate));
    }
}
