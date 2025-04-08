package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ResourceHistoryDto;
import com.skillmetrics.api.service.ResourceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resource-history")
@RequiredArgsConstructor
public class ResourceHistoryController {

    private final ResourceHistoryService resourceHistoryService;

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ResourceHistoryDto> getHistoryById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryById(id));
    }
    
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByProjectId(projectId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByUserId(userId));
    }
    
    @GetMapping("/project/{projectId}/user/{userId}")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByProjectAndUser(
            @PathVariable Long projectId,
            @PathVariable Long userId) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByProjectAndUser(projectId, userId));
    }
    
    @GetMapping("/action/{action}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<ResourceHistoryDto>> getHistoryByAction(@PathVariable String action) {
        return ResponseEntity.ok(resourceHistoryService.getHistoryByAction(action));
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<ResourceHistoryDto>> getAllHistory() {
        return ResponseEntity.ok(resourceHistoryService.getAllHistory());
    }
}
