package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ExportDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.SkillExport;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillExportRepository;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final SkillExportRepository exportRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<ExportDto> getUserExports(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id " + userId);
        }
        
        return exportRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ExportDto getExportById(Long id) {
        SkillExport export = exportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export not found with id " + id));
        
        return convertToDto(export);
    }
    
    @Transactional
    public ExportDto createExport(Long userId, String format) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        
        // Validate format
        if (!isValidFormat(format)) {
            throw new IllegalArgumentException("Invalid export format: " + format);
        }
        
        // Create export record
        SkillExport export = new SkillExport();
        export.setUser(user);
        export.setFormat(format.toLowerCase());
        export.setStatus("pending");
        
        SkillExport savedExport = exportRepository.save(export);
        
        // Trigger async processing
        processExportAsync(savedExport.getId());
        
        return convertToDto(savedExport);
    }
    
    @Async
    @Transactional
    public void processExportAsync(Long exportId) {
        SkillExport export = exportRepository.findById(exportId)
                .orElseThrow(() -> new ResourceNotFoundException("Export not found with id " + exportId));
        
        try {
            // Update status to processing
            export.setStatus("processing");
            exportRepository.save(export);
            
            // Get user skills
            List<Skill> skills = skillRepository.findByUserId(export.getUser().getId());
            
            if (skills.isEmpty()) {
                export.setStatus("completed");
                export.setErrorMessage("No skills found to export");
                exportRepository.save(export);
                
                // Notify user
                notifyExportComplete(export, "Your skills export has been completed, but no skills were found to export.");
                return;
            }
            
            // Generate file based on format
            String fileName = generateFileName(export.getUser().getUsername(), export.getFormat());
            String fileContent = generateFileContent(skills, export.getFormat());
            
            // Create temp file
            Path tempDir = Files.createTempDirectory("skillexports");
            File tempFile = new File(tempDir.toFile(), fileName);
            try (FileWriter writer = new FileWriter(tempFile)) {
                writer.write(fileContent);
            }
            
            // Upload to storage
            String fileUrl = fileStorageService.uploadFile(tempFile, "exports/" + fileName);
            
            // Update export record
            export.setFileName(fileName);
            export.setFileUrl(fileUrl);
            export.setFileSize(tempFile.length());
            export.setStatus("completed");
            export.setCompletedAt(LocalDateTime.now());
            
            // Clean up temp file
            Files.deleteIfExists(tempFile.toPath());
            Files.deleteIfExists(tempDir);
            
            // Save updated export
            exportRepository.save(export);
            
            // Notify user
            notifyExportComplete(export, "Your skills export has been completed and is now available for download.");
            
        } catch (Exception e) {
            // Handle error
            export.setStatus("failed");
            export.setErrorMessage(e.getMessage());
            exportRepository.save(export);
            
            // Notify user about failure
            notifyExportFailed(export, "Your skills export could not be completed due to an error: " + e.getMessage());
        }
    }
    
    @Transactional
    public void deleteExport(Long id, Long userId) {
        SkillExport export = exportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export not found with id " + id));
        
        // Check if the export belongs to the user
        if (!export.getUser().getId().equals(userId)) {
            throw new IllegalStateException("You are not authorized to delete this export");
        }
        
        // Delete file if it exists
        if (export.getFileUrl() != null && !export.getFileUrl().isEmpty()) {
            try {
                fileStorageService.deleteFile(export.getFileName());
            } catch (Exception e) {
                // Log error but continue with deleting the record
                System.err.println("Failed to delete export file: " + e.getMessage());
            }
        }
        
        exportRepository.delete(export);
    }
    
    @Transactional(readOnly = true)
    public byte[] downloadExport(Long id, Long userId) throws IOException {
        SkillExport export = exportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Export not found with id " + id));
        
        // Check if the export belongs to the user or the user is an admin
        if (!export.getUser().getId().equals(userId) && 
                !export.getUser().getRole().equals("ROLE_ADMIN")) {
            throw new IllegalStateException("You are not authorized to download this export");
        }
        
        // Check if export is completed
        if (!export.getStatus().equals("completed")) {
            throw new IllegalStateException("Export is not ready for download. Current status: " + export.getStatus());
        }
        
        // Download file from storage
        return fileStorageService.downloadFile(export.getFileName());
    }
    
    // Helper methods
    
    private boolean isValidFormat(String format) {
        format = format.toLowerCase();
        return format.equals("pdf") || format.equals("csv") || format.equals("json");
    }
    
    private String generateFileName(String username, String format) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        return username + "_skills_" + timestamp + "." + format.toLowerCase();
    }
    
    private String generateFileContent(List<Skill> skills, String format) {
        format = format.toLowerCase();
        
        switch (format) {
            case "csv":
                return generateCsvContent(skills);
            case "json":
                return generateJsonContent(skills);
            case "pdf":
                // For PDF we might generate interim data that will be used to create a PDF
                return generatePdfContent(skills);
            default:
                throw new IllegalArgumentException("Unsupported export format: " + format);
        }
    }
    
    private String generateCsvContent(List<Skill> skills) {
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Name,Category,Level,Description,Certification,Endorsements,Created Date\n");
        
        // Rows
        for (Skill skill : skills) {
            csv.append(escapeSpecialCharacters(skill.getName())).append(",");
            csv.append(escapeSpecialCharacters(skill.getCategory())).append(",");
            csv.append(escapeSpecialCharacters(skill.getLevel())).append(",");
            csv.append(escapeSpecialCharacters(skill.getDescription())).append(",");
            csv.append(escapeSpecialCharacters(skill.getCertification())).append(",");
            csv.append(skill.getEndorsements() != null ? skill.getEndorsements().size() : 0).append(",");
            csv.append(skill.getCreatedAt().format(DateTimeFormatter.ISO_DATE)).append("\n");
        }
        
        return csv.toString();
    }
    
    private String escapeSpecialCharacters(String data) {
        if (data == null) {
            return "";
        }
        
        String escapedData = data.replaceAll("\"", "\"\"");
        if (escapedData.contains(",") || escapedData.contains("\"") || escapedData.contains("\n")) {
            return "\"" + escapedData + "\"";
        }
        return escapedData;
    }
    
    private String generateJsonContent(List<Skill> skills) {
        StringBuilder json = new StringBuilder();
        json.append("[\n");
        
        for (int i = 0; i < skills.size(); i++) {
            Skill skill = skills.get(i);
            json.append("  {\n");
            json.append("    \"id\": ").append(skill.getId()).append(",\n");
            json.append("    \"name\": \"").append(escapeJsonString(skill.getName())).append("\",\n");
            json.append("    \"category\": \"").append(escapeJsonString(skill.getCategory())).append("\",\n");
            json.append("    \"level\": \"").append(escapeJsonString(skill.getLevel())).append("\",\n");
            
            if (skill.getDescription() != null && !skill.getDescription().isEmpty()) {
                json.append("    \"description\": \"").append(escapeJsonString(skill.getDescription())).append("\",\n");
            }
            
            if (skill.getCertification() != null && !skill.getCertification().isEmpty()) {
                json.append("    \"certification\": \"").append(escapeJsonString(skill.getCertification())).append("\",\n");
            }
            
            json.append("    \"endorsementCount\": ").append(skill.getEndorsements() != null ? skill.getEndorsements().size() : 0).append(",\n");
            json.append("    \"createdAt\": \"").append(skill.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME)).append("\"\n");
            
            json.append("  }");
            
            if (i < skills.size() - 1) {
                json.append(",");
            }
            
            json.append("\n");
        }
        
        json.append("]\n");
        return json.toString();
    }
    
    private String escapeJsonString(String input) {
        if (input == null) {
            return "";
        }
        
        return input
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
    
    private String generatePdfContent(List<Skill> skills) {
        // For PDF export, we'll generate HTML content that will be converted to PDF
        StringBuilder html = new StringBuilder();
        
        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("  <title>Skill Export</title>\n");
        html.append("  <style>\n");
        html.append("    body { font-family: Arial, sans-serif; }\n");
        html.append("    table { width: 100%; border-collapse: collapse; }\n");
        html.append("    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n");
        html.append("    th { background-color: #f2f2f2; }\n");
        html.append("    tr:nth-child(even) { background-color: #f9f9f9; }\n");
        html.append("  </style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        
        html.append("  <h1>Skills Export</h1>\n");
        html.append("  <p>User: ").append(skills.get(0).getUser().getFirstName()).append(" ").append(skills.get(0).getUser().getLastName()).append("</p>\n");
        html.append("  <p>Date: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("</p>\n");
        
        html.append("  <table>\n");
        html.append("    <tr>\n");
        html.append("      <th>Name</th>\n");
        html.append("      <th>Category</th>\n");
        html.append("      <th>Level</th>\n");
        html.append("      <th>Description</th>\n");
        html.append("      <th>Certification</th>\n");
        html.append("      <th>Endorsements</th>\n");
        html.append("      <th>Created Date</th>\n");
        html.append("    </tr>\n");
        
        for (Skill skill : skills) {
            html.append("    <tr>\n");
            html.append("      <td>").append(skill.getName()).append("</td>\n");
            html.append("      <td>").append(skill.getCategory()).append("</td>\n");
            html.append("      <td>").append(skill.getLevel()).append("</td>\n");
            html.append("      <td>").append(skill.getDescription() != null ? skill.getDescription() : "").append("</td>\n");
            html.append("      <td>").append(skill.getCertification() != null ? skill.getCertification() : "").append("</td>\n");
            html.append("      <td>").append(skill.getEndorsements() != null ? skill.getEndorsements().size() : 0).append("</td>\n");
            html.append("      <td>").append(skill.getCreatedAt().format(DateTimeFormatter.ISO_DATE)).append("</td>\n");
            html.append("    </tr>\n");
        }
        
        html.append("  </table>\n");
        html.append("</body>\n");
        html.append("</html>\n");
        
        return html.toString();
    }
    
    private void notifyExportComplete(SkillExport export, String message) {
        // Send in-app notification
        notificationService.createNotification(
                export.getUser().getId(),
                message,
                "/profile/exports",
                "export_complete"
        );
        
        // Send email notification
        try {
            emailService.sendExportCompleteEmail(
                    export.getUser().getEmail(),
                    export.getUser().getFirstName() + " " + export.getUser().getLastName(),
                    export.getFormat().toUpperCase(),
                    export.getFileUrl()
            );
        } catch (Exception e) {
            // Log error but don't fail the process
            System.err.println("Failed to send export complete email: " + e.getMessage());
        }
    }
    
    private void notifyExportFailed(SkillExport export, String message) {
        // Send in-app notification
        notificationService.createNotification(
                export.getUser().getId(),
                message,
                "/profile/exports",
                "export_failed"
        );
        
        // Send email notification
        try {
            emailService.sendExportFailedEmail(
                    export.getUser().getEmail(),
                    export.getUser().getFirstName() + " " + export.getUser().getLastName(),
                    export.getFormat().toUpperCase(),
                    export.getErrorMessage()
            );
        } catch (Exception e) {
            // Log error but don't fail the process
            System.err.println("Failed to send export failed email: " + e.getMessage());
        }
    }
    
    private ExportDto convertToDto(SkillExport export) {
        return ExportDto.builder()
                .id(export.getId())
                .userId(export.getUser().getId())
                .userName(export.getUser().getFirstName() + " " + export.getUser().getLastName())
                .format(export.getFormat())
                .fileUrl(export.getFileUrl())
                .fileName(export.getFileName())
                .status(export.getStatus())
                .errorMessage(export.getErrorMessage())
                .fileSize(export.getFileSize())
                .createdAt(export.getCreatedAt())
                .completedAt(export.getCompletedAt())
                .build();
    }
}
