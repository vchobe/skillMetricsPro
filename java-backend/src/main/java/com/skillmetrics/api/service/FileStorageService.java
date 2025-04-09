package com.skillmetrics.api.service;

import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    private final UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored", ex);
        }
    }

    public Map<String, Object> storeFile(MultipartFile file, String category, Long userId) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        }

        // Normalize file name
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFilename);
        
        // Generate a unique file name to prevent conflicts
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Create subdirectory based on category
        Path categoryPath = this.fileStorageLocation.resolve(category);
        try {
            Files.createDirectories(categoryPath);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create directory for category: " + category, ex);
        }
        
        // Create user subdirectory if userId is provided
        Path finalPath = categoryPath;
        if (user != null) {
            finalPath = categoryPath.resolve(user.getId().toString());
            try {
                Files.createDirectories(finalPath);
            } catch (IOException ex) {
                throw new RuntimeException("Could not create directory for user: " + user.getId(), ex);
            }
        }

        try {
            // Check if the filename contains invalid characters
            if (originalFilename.contains("..")) {
                throw new RuntimeException("Filename contains invalid path sequence " + originalFilename);
            }

            Path targetLocation = finalPath.resolve(uniqueFilename);
            
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            
            // Prepare result metadata
            Map<String, Object> result = new HashMap<>();
            result.put("fileName", uniqueFilename);
            result.put("originalFileName", originalFilename);
            result.put("fileType", file.getContentType());
            result.put("size", file.getSize());
            result.put("category", category);
            
            if (user != null) {
                result.put("userId", user.getId());
                result.put("userName", user.getFirstName() + " " + user.getLastName());
            }
            
            // Calculate relative path for storage in DB
            String relativePath = category;
            if (user != null) {
                relativePath = category + "/" + user.getId();
            }
            result.put("filePath", relativePath + "/" + uniqueFilename);
            
            return result;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }
    }

    public Resource loadFileAsResource(String filePath) {
        try {
            Path resolvedPath = this.fileStorageLocation.resolve(filePath).normalize();
            Resource resource = new UrlResource(resolvedPath.toUri());
            
            if (resource.exists()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + filePath);
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + filePath, ex);
        }
    }
    
    public boolean deleteFile(String filePath) {
        try {
            Path resolvedPath = this.fileStorageLocation.resolve(filePath).normalize();
            return Files.deleteIfExists(resolvedPath);
        } catch (IOException ex) {
            log.error("Error deleting file: {}", filePath, ex);
            return false;
        }
    }
    
    public Map<String, String> getFileMetadata(String filePath) {
        try {
            Path resolvedPath = this.fileStorageLocation.resolve(filePath).normalize();
            
            if (!Files.exists(resolvedPath)) {
                throw new ResourceNotFoundException("File not found: " + filePath);
            }
            
            Map<String, String> metadata = new HashMap<>();
            metadata.put("fileName", resolvedPath.getFileName().toString());
            metadata.put("fileSize", String.valueOf(Files.size(resolvedPath)));
            metadata.put("lastModified", Files.getLastModifiedTime(resolvedPath).toString());
            metadata.put("fullPath", resolvedPath.toAbsolutePath().toString());
            
            // Try to determine content type
            String contentType = Files.probeContentType(resolvedPath);
            metadata.put("contentType", contentType != null ? contentType : "application/octet-stream");
            
            return metadata;
        } catch (IOException ex) {
            throw new RuntimeException("Error getting file metadata: " + filePath, ex);
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}