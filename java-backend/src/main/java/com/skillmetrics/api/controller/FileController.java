package com.skillmetrics.api.controller;

import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") String category,
            @RequestParam(value = "userId", required = false) Long userId,
            @CurrentUser UserPrincipal currentUser) {
        
        // If userId is not provided, use the current user's ID
        if (userId == null) {
            userId = currentUser.getId();
        }
        
        // Only admins and managers can upload files for other users
        if (!currentUser.getId().equals(userId) && 
                !currentUser.getAuthorities().stream().anyMatch(a -> 
                        a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"))) {
            return ResponseEntity.status(403).build();
        }
        
        Map<String, Object> uploadResult = fileStorageService.storeFile(file, category, userId);
        return ResponseEntity.ok(uploadResult);
    }

    @GetMapping("/download/{category}/{userId}/{fileName}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String category,
            @PathVariable String userId,
            @PathVariable String fileName,
            HttpServletRequest request) {
        
        String filePath = category + "/" + userId + "/" + fileName;
        Resource resource = fileStorageService.loadFileAsResource(filePath);

        // Try to determine file's content type
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // Logger would be used here in a production environment
        }

        // Fallback to the default content type if type could not be determined
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    @GetMapping("/download/{category}/{fileName}")
    public ResponseEntity<Resource> downloadPublicFile(
            @PathVariable String category,
            @PathVariable String fileName,
            HttpServletRequest request) {
        
        String filePath = category + "/" + fileName;
        Resource resource = fileStorageService.loadFileAsResource(filePath);

        // Try to determine file's content type
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            // Logger would be used here in a production environment
        }

        // Fallback to the default content type if type could not be determined
        if (contentType == null) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
    
    @DeleteMapping("/{filePath}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Boolean>> deleteFile(@PathVariable String filePath) {
        boolean result = fileStorageService.deleteFile(filePath);
        return ResponseEntity.ok(Map.of("deleted", result));
    }
    
    @GetMapping("/metadata/{filePath}")
    public ResponseEntity<Map<String, String>> getFileMetadata(@PathVariable String filePath) {
        Map<String, String> metadata = fileStorageService.getFileMetadata(filePath);
        return ResponseEntity.ok(metadata);
    }
}