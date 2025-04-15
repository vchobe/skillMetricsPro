package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ExportDto;
import com.skillmetrics.api.dto.ExportRequestDto;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * Controller for data export operations.
 * Handles creating, retrieving, and downloading exports in various formats.
 */
@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    /**
     * Get exports for the current user
     */
    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExportDto>> getUserExports(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(exportService.getUserExports(currentUser.getId()));
    }
    
    /**
     * Get all exports (admin only)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ExportDto>> getAllExports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(exportService.getAllExports(page, size));
    }
    
    /**
     * Get export by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> getExportById(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        ExportDto export = exportService.getExportById(id);
        
        // Check if the export belongs to the current user
        if (!export.getUserId().equals(currentUser.getId()) &&
                !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        return ResponseEntity.ok(export);
    }
    
    /**
     * Create a basic export for the current user
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> createExport(
            @RequestParam String format,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.createExport(currentUser.getId(), format));
    }
    
    /**
     * Create an advanced export with specific parameters
     */
    @PostMapping("/advanced")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> createAdvancedExport(
            @Valid @RequestBody ExportRequestDto exportRequest,
            @CurrentUser UserPrincipal currentUser) {
        
        exportRequest.setUserId(currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.createAdvancedExport(exportRequest));
    }
    
    /**
     * Create an advanced admin export (admin only)
     */
    @PostMapping("/admin/export-data")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExportDto> createAdminExport(
            @Valid @RequestBody ExportRequestDto exportRequest,
            @CurrentUser UserPrincipal currentUser) {
        
        exportRequest.setUserId(currentUser.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.createAdminExport(exportRequest));
    }
    
    /**
     * Export skills in a specific format
     */
    @PostMapping("/skills")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> exportSkills(
            @RequestParam String format,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String level,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.exportSkills(currentUser.getId(), format, category, level));
    }
    
    /**
     * Export projects in a specific format
     */
    @PostMapping("/projects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> exportProjects(
            @RequestParam String format,
            @RequestParam(required = false) String status,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.exportProjects(currentUser.getId(), format, status));
    }
    
    /**
     * Export users in a specific format (admin only)
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExportDto> exportUsers(
            @RequestParam String format,
            @RequestParam(required = false) String role,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.exportUsers(currentUser.getId(), format, role));
    }
    
    /**
     * Export analytics in a specific format (admin only)
     */
    @PostMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ExportDto> exportAnalytics(
            @RequestParam String format,
            @RequestParam String reportType,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.exportAnalytics(currentUser.getId(), format, reportType));
    }
    
    /**
     * Delete an export
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteExport(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        exportService.deleteExport(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Download an export
     */
    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadExport(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        try {
            ExportDto export = exportService.getExportById(id);
            
            // Check if the export belongs to the current user
            if (!export.getUserId().equals(currentUser.getId()) &&
                    !currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            // Get file content
            byte[] fileContent = exportService.downloadExport(id, currentUser.getId());
            
            // Determine media type
            MediaType mediaType = determineMediaType(export.getFormat());
            
            // Create response with appropriate headers for download
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + export.getFileName() + "\"")
                    .body(fileContent);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get available export formats
     */
    @GetMapping("/formats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getAvailableFormats() {
        return ResponseEntity.ok(exportService.getAvailableFormats());
    }
    
    /**
     * Get export types for admin exports
     */
    @GetMapping("/admin/types")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminExportTypes() {
        return ResponseEntity.ok(exportService.getAdminExportTypes());
    }
    
    /**
     * Export a specific report as PDF
     */
    @PostMapping("/report/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestBody(required = false) Map<String, Object> reportParams,
            @CurrentUser UserPrincipal currentUser) {
        
        try {
            // Generate report
            byte[] reportContent = exportService.generateReport(reportType, reportParams, currentUser.getId());
            
            // Create filename
            String filename = reportType.toLowerCase().replace(" ", "-") + "-report.pdf";
            
            // Return PDF
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(reportContent);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get export statistics (admin only)
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getExportStatistics() {
        return ResponseEntity.ok(exportService.getExportStatistics());
    }
    
    /**
     * Helper method to determine media type from format
     */
    private MediaType determineMediaType(String format) {
        if (format == null) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
        
        switch (format.toLowerCase()) {
            case "pdf":
                return MediaType.APPLICATION_PDF;
            case "csv":
                return MediaType.valueOf("text/csv");
            case "json":
                return MediaType.APPLICATION_JSON;
            case "xlsx":
                return MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "xml":
                return MediaType.APPLICATION_XML;
            default:
                return MediaType.APPLICATION_OCTET_STREAM;
        }
    }
}
