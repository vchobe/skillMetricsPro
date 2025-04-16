package com.skillmetrics.api.controller;

import com.skillmetrics.api.service.MigrationService;
import jakarta.servlet.http.HttpServletResponse;
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
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final MigrationService migrationService;

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Integer>> importData(@RequestParam("file") MultipartFile file) 
            throws IOException {
        return ResponseEntity.ok(migrationService.migrateData(file));
    }
    
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Integer>> exportData(HttpServletResponse response) throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=skillmetrics_export.json");
        
        return ResponseEntity.ok(migrationService.exportData());
    }
}
