package com.skillmetrics.api.service;

import com.skillmetrics.api.exception.FileStorageException;
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
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {

    @Value("${app.file-storage.upload-dir:uploads}")
    private String uploadDir;

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new FileStorageException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    /**
     * Store a file
     * @param file the file to store
     * @param subdirectory Optional subdirectory to store the file in
     * @return the name of the stored file
     */
    public String storeFile(MultipartFile file, String subdirectory) {
        // Normalize file name
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Check if the file's name contains invalid characters
            if (fileName.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + fileName);
            }

            // Create subdirectory if provided
            Path targetLocation;
            if (subdirectory != null && !subdirectory.isEmpty()) {
                Path subdir = this.fileStorageLocation.resolve(subdirectory);
                Files.createDirectories(subdir);
                targetLocation = subdir.resolve(fileName);
            } else {
                targetLocation = this.fileStorageLocation.resolve(fileName);
            }

            // Copy file to the target location (replacing existing file with the same name)
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return fileName;
        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + fileName + ". Please try again!", ex);
        }
    }

    /**
     * Store a file with a specific name
     * @param file the file to store
     * @param newFileName the name to save the file with
     * @param subdirectory Optional subdirectory to store the file in
     * @return the name of the stored file
     */
    public String storeFileWithName(MultipartFile file, String newFileName, String subdirectory) {
        try {
            // Check if the new file name contains invalid characters
            if (newFileName.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence: " + newFileName);
            }

            // Create subdirectory if provided
            Path targetLocation;
            if (subdirectory != null && !subdirectory.isEmpty()) {
                Path subdir = this.fileStorageLocation.resolve(subdirectory);
                Files.createDirectories(subdir);
                targetLocation = subdir.resolve(newFileName);
            } else {
                targetLocation = this.fileStorageLocation.resolve(newFileName);
            }

            // Copy file to the target location (replacing existing file with the same name)
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return newFileName;
        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + newFileName + ". Please try again!", ex);
        }
    }

    /**
     * Load a file as a resource
     * @param fileName the name of the file to load
     * @param subdirectory Optional subdirectory where the file is stored
     * @return the file resource
     */
    public Resource loadFileAsResource(String fileName, String subdirectory) {
        try {
            Path filePath;
            if (subdirectory != null && !subdirectory.isEmpty()) {
                filePath = this.fileStorageLocation.resolve(subdirectory).resolve(fileName).normalize();
            } else {
                filePath = this.fileStorageLocation.resolve(fileName).normalize();
            }
            
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists()) {
                return resource;
            } else {
                throw new FileStorageException("File not found " + fileName);
            }
        } catch (MalformedURLException ex) {
            throw new FileStorageException("File not found " + fileName, ex);
        }
    }

    /**
     * Delete a file
     * @param fileName the name of the file to delete
     * @param subdirectory Optional subdirectory where the file is stored
     * @return true if the file was deleted, false otherwise
     */
    public boolean deleteFile(String fileName, String subdirectory) {
        try {
            Path filePath;
            if (subdirectory != null && !subdirectory.isEmpty()) {
                filePath = this.fileStorageLocation.resolve(subdirectory).resolve(fileName).normalize();
            } else {
                filePath = this.fileStorageLocation.resolve(fileName).normalize();
            }
            
            return Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.error("Error deleting file", ex);
            return false;
        }
    }

    /**
     * List all files in a directory
     * @param subdirectory Optional subdirectory to list files from
     * @return a list of file names
     */
    public List<String> listFiles(String subdirectory) {
        try {
            Path dirPath;
            if (subdirectory != null && !subdirectory.isEmpty()) {
                dirPath = this.fileStorageLocation.resolve(subdirectory);
                // Create directory if it doesn't exist
                if (!Files.exists(dirPath)) {
                    Files.createDirectories(dirPath);
                }
            } else {
                dirPath = this.fileStorageLocation;
            }
            
            try (Stream<Path> paths = Files.list(dirPath)) {
                return paths
                        .filter(Files::isRegularFile)
                        .map(Path::getFileName)
                        .map(Path::toString)
                        .collect(Collectors.toList());
            }
        } catch (IOException ex) {
            log.error("Error listing files", ex);
            return List.of();
        }
    }
}