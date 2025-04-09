package com.skillmetrics.api.controller;

import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.DataExportService;
import com.skillmetrics.api.service.DataImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
public class DataController {

    private final DataExportService dataExportService;
    private final DataImportService dataImportService;

    // Export endpoints

    @GetMapping("/export/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportAllSkills(
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportSkillsData(null, format);
        String filename = dataExportService.generateExportFilename("skills", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/skills/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<byte[]> exportUserSkills(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportSkillsData(userId, format);
        String filename = dataExportService.generateExportFilename("user_skills", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportUsers(
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportUsersData(format);
        String filename = dataExportService.generateExportFilename("users", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportProjects(
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportProjectsData(format);
        String filename = dataExportService.generateExportFilename("projects", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportAnalytics(
            @RequestParam(defaultValue = "json") String format) throws IOException {
        
        byte[] data = dataExportService.exportAnalyticsData(format);
        String filename = dataExportService.generateExportFilename("analytics", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/projects/{projectId}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportProjectResources(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportProjectResourcesData(projectId, format);
        String filename = dataExportService.generateExportFilename("project_resources", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    @GetMapping("/export/users/{userId}/projects")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #userId == authentication.principal.id")
    public ResponseEntity<byte[]> exportUserProjects(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        
        byte[] data = dataExportService.exportUserProjectsData(userId, format);
        String filename = dataExportService.generateExportFilename("user_projects", format);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }
    
    // Import endpoints
    
    @PostMapping("/import/validate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> validateImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileType") String fileType,
            @RequestParam("dataType") String dataType) {
        
        Map<String, Object> validationResult = dataImportService.validateImportFile(file, fileType, dataType);
        return ResponseEntity.ok(validationResult);
    }
    
    @PostMapping("/import/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> importUsers(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileType") String fileType) {
        
        Map<String, Object> importResult = dataImportService.importUsers(file, fileType);
        return ResponseEntity.ok(importResult);
    }
    
    @PostMapping("/import/skills")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> importSkills(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileType") String fileType,
            @CurrentUser UserPrincipal currentUser) {
        
        Map<String, Object> importResult = dataImportService.importSkills(file, fileType, currentUser.getId());
        return ResponseEntity.ok(importResult);
    }
}