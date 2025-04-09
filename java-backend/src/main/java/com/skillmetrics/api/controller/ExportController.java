package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ExportDto;
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

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/exports")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/user")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ExportDto>> getUserExports(@CurrentUser UserPrincipal currentUser) {
        return ResponseEntity.ok(exportService.getUserExports(currentUser.getId()));
    }
    
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
    
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ExportDto> createExport(
            @RequestParam String format,
            @CurrentUser UserPrincipal currentUser) {
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(exportService.createExport(currentUser.getId(), format));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteExport(
            @PathVariable Long id,
            @CurrentUser UserPrincipal currentUser) {
        
        exportService.deleteExport(id, currentUser.getId());
        return ResponseEntity.noContent().build();
    }
    
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
            MediaType mediaType = MediaType.APPLICATION_OCTET_STREAM;
            if (export.getFormat().equalsIgnoreCase("pdf")) {
                mediaType = MediaType.APPLICATION_PDF;
            } else if (export.getFormat().equalsIgnoreCase("csv")) {
                mediaType = MediaType.valueOf("text/csv");
            } else if (export.getFormat().equalsIgnoreCase("json")) {
                mediaType = MediaType.APPLICATION_JSON;
            }
            
            // Create response with appropriate headers for download
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + export.getFileName() + "\"")
                    .body(fileContent);
            
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
