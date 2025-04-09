package com.skillmetrics.api.controller;

import com.skillmetrics.api.exception.FileStorageException;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {

    private final FileStorageService fileStorageService;

    /**
     * Upload a single file
     */
    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "directory", required = false) String directory,
            @CurrentUser UserPrincipal currentUser) {
        
        String fileName = fileStorageService.storeFile(file, directory);
        
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(fileName)
                .queryParam("directory", directory)
                .toUriString();
        
        Map<String, Object> response = new HashMap<>();
        response.put("fileName", fileName);
        response.put("fileDownloadUri", fileDownloadUri);
        response.put("fileType", file.getContentType());
        response.put("size", file.getSize());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Upload multiple files
     */
    @PostMapping("/upload-multiple")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "directory", required = false) String directory,
            @CurrentUser UserPrincipal currentUser) {
        
        List<Map<String, Object>> responses = Arrays.stream(files)
                .map(file -> {
                    String fileName = fileStorageService.storeFile(file, directory);
                    
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/download/")
                            .path(fileName)
                            .queryParam("directory", directory)
                            .toUriString();
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("fileName", fileName);
                    response.put("fileDownloadUri", fileDownloadUri);
                    response.put("fileType", file.getContentType());
                    response.put("size", file.getSize());
                    
                    return response;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    /**
     * Download a file
     */
    @GetMapping("/download/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileName,
            @RequestParam(value = "directory", required = false) String directory,
            HttpServletRequest request) {
        
        // Load file as Resource
        Resource resource = fileStorageService.loadFileAsResource(fileName, directory);
        
        // Try to determine file's content type
        String contentType = null;
        try {
            contentType = request.getServletContext().getMimeType(resource.getFile().getAbsolutePath());
        } catch (IOException ex) {
            log.info("Could not determine file type.");
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

    /**
     * List all files in a directory
     */
    @GetMapping("/list")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> listFiles(
            @RequestParam(value = "directory", required = false) String directory) {
        
        List<String> files = fileStorageService.listFiles(directory);
        
        List<Map<String, Object>> fileDetails = files.stream()
                .map(fileName -> {
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/download/")
                            .path(fileName)
                            .queryParam("directory", directory)
                            .toUriString();
                    
                    Map<String, Object> fileDetail = new HashMap<>();
                    fileDetail.put("fileName", fileName);
                    fileDetail.put("fileDownloadUri", fileDownloadUri);
                    
                    return fileDetail;
                })
                .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("directory", directory != null ? directory : "root");
        response.put("files", fileDetails);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a file
     */
    @DeleteMapping("/delete/{fileName:.+}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> deleteFile(
            @PathVariable String fileName,
            @RequestParam(value = "directory", required = false) String directory,
            @CurrentUser UserPrincipal currentUser) {
        
        boolean deleted = fileStorageService.deleteFile(fileName, directory);
        
        Map<String, Object> response = new HashMap<>();
        if (deleted) {
            response.put("success", true);
            response.put("message", "File deleted successfully");
        } else {
            response.put("success", false);
            response.put("message", "Failed to delete file or file not found");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Check if a file exists
     */
    @GetMapping("/exists/{fileName:.+}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> fileExists(
            @PathVariable String fileName,
            @RequestParam(value = "directory", required = false) String directory) {
        
        Map<String, Object> response = new HashMap<>();
        try {
            Resource resource = fileStorageService.loadFileAsResource(fileName, directory);
            response.put("exists", true);
            response.put("fileName", fileName);
        } catch (FileStorageException e) {
            response.put("exists", false);
            response.put("fileName", fileName);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Upload a file with a specified name
     */
    @PostMapping("/upload-with-name")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> uploadFileWithName(
            @RequestParam("file") MultipartFile file,
            @RequestParam("fileName") String fileName,
            @RequestParam(value = "directory", required = false) String directory,
            @CurrentUser UserPrincipal currentUser) {
        
        String storedFileName = fileStorageService.storeFileWithName(file, fileName, directory);
        
        String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/files/download/")
                .path(storedFileName)
                .queryParam("directory", directory)
                .toUriString();
        
        Map<String, Object> response = new HashMap<>();
        response.put("fileName", storedFileName);
        response.put("fileDownloadUri", fileDownloadUri);
        response.put("fileType", file.getContentType());
        response.put("size", file.getSize());
        
        return ResponseEntity.ok(response);
    }
}