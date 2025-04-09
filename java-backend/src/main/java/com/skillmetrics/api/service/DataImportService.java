package com.skillmetrics.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillmetrics.api.exception.ImportException;
import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataImportService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    /**
     * Validate an import file before processing
     */
    public Map<String, Object> validateImportFile(MultipartFile file, String fileType, String dataType) {
        Map<String, Object> result = new HashMap<>();
        result.put("valid", false);
        
        try {
            if (file.isEmpty()) {
                result.put("error", "File is empty");
                return result;
            }
            
            // Check file type
            if (!isValidFileType(fileType)) {
                result.put("error", "Unsupported file type: " + fileType);
                return result;
            }
            
            // Check data type
            if (!isValidDataType(dataType)) {
                result.put("error", "Unsupported data type: " + dataType);
                return result;
            }
            
            // Validate file content based on file type and data type
            Map<String, Object> validationDetails = new HashMap<>();
            
            if ("csv".equalsIgnoreCase(fileType)) {
                validationDetails = validateCsvFile(file, dataType);
            } else if ("json".equalsIgnoreCase(fileType)) {
                validationDetails = validateJsonFile(file, dataType);
            }
            
            if (validationDetails.containsKey("error")) {
                result.put("error", validationDetails.get("error"));
                return result;
            }
            
            result.put("valid", true);
            result.put("rowCount", validationDetails.get("rowCount"));
            result.put("sampleData", validationDetails.get("sampleData"));
            
        } catch (Exception e) {
            log.error("Error validating import file", e);
            result.put("error", "Error validating file: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Import users from a file
     */
    @Transactional
    public Map<String, Object> importUsers(MultipartFile file, String fileType) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        
        try {
            List<Map<String, Object>> userData;
            
            if ("csv".equalsIgnoreCase(fileType)) {
                userData = parseCsvToList(file, "users");
            } else if ("json".equalsIgnoreCase(fileType)) {
                userData = parseJsonToList(file, "users");
            } else {
                throw new ImportException("Unsupported file type: " + fileType);
            }
            
            int imported = 0;
            int skipped = 0;
            List<String> errors = new ArrayList<>();
            
            for (Map<String, Object> userMap : userData) {
                try {
                    String email = (String) userMap.get("email");
                    
                    // Skip if email already exists
                    if (userRepository.findByEmail(email).isPresent()) {
                        skipped++;
                        continue;
                    }
                    
                    User user = new User();
                    user.setEmail(email);
                    user.setFirstName((String) userMap.get("firstName"));
                    user.setLastName((String) userMap.get("lastName"));
                    
                    // Set role if provided, default to USER
                    String role = (String) userMap.get("role");
                    user.setRole(role != null && !role.isEmpty() ? role : "ROLE_USER");
                    
                    // Set location if provided
                    user.setLocation((String) userMap.get("location"));
                    
                    // Generate a temporary password
                    String tempPassword = UUID.randomUUID().toString().substring(0, 8);
                    user.setPassword(passwordEncoder.encode(tempPassword));
                    
                    // Set email verification status
                    user.setEmailVerified(false);
                    
                    // Set timestamps
                    LocalDateTime now = LocalDateTime.now();
                    user.setCreatedAt(now);
                    user.setUpdatedAt(now);
                    
                    userRepository.save(user);
                    imported++;
                    
                    // TODO: Send email with temporary password
                    
                } catch (Exception e) {
                    log.error("Error importing user", e);
                    errors.add("Error importing user at row " + (imported + skipped + 1) + ": " + e.getMessage());
                }
            }
            
            result.put("success", true);
            result.put("imported", imported);
            result.put("skipped", skipped);
            result.put("errors", errors);
            
        } catch (Exception e) {
            log.error("Error importing users", e);
            result.put("error", "Error importing users: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Import skills from a file
     */
    @Transactional
    public Map<String, Object> importSkills(MultipartFile file, String fileType, Long importedBy) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        
        try {
            List<Map<String, Object>> skillData;
            
            if ("csv".equalsIgnoreCase(fileType)) {
                skillData = parseCsvToList(file, "skills");
            } else if ("json".equalsIgnoreCase(fileType)) {
                skillData = parseJsonToList(file, "skills");
            } else {
                throw new ImportException("Unsupported file type: " + fileType);
            }
            
            int imported = 0;
            int updated = 0;
            int skipped = 0;
            List<String> errors = new ArrayList<>();
            
            for (Map<String, Object> skillMap : skillData) {
                try {
                    Long userId = Long.parseLong(skillMap.get("userId").toString());
                    String name = (String) skillMap.get("name");
                    String category = (String) skillMap.get("category");
                    
                    // Check if user exists
                    if (!userRepository.existsById(userId)) {
                        errors.add("User ID " + userId + " does not exist for skill: " + name);
                        skipped++;
                        continue;
                    }
                    
                    // Check if skill already exists for this user and category
                    Optional<Skill> existingSkill = skillRepository.findByUserIdAndNameAndCategory(userId, name, category);
                    
                    if (existingSkill.isPresent()) {
                        // Update existing skill
                        Skill skill = existingSkill.get();
                        skill.setLevel((String) skillMap.get("level"));
                        skill.setDescription((String) skillMap.get("description"));
                        skill.setCertification((String) skillMap.get("certification"));
                        skill.setCredlyLink((String) skillMap.get("credlyLink"));
                        skill.setUpdatedAt(LocalDateTime.now());
                        
                        skillRepository.save(skill);
                        updated++;
                    } else {
                        // Create new skill
                        Skill skill = new Skill();
                        skill.setUserId(userId);
                        skill.setName(name);
                        skill.setCategory(category);
                        skill.setLevel((String) skillMap.get("level"));
                        skill.setDescription((String) skillMap.get("description"));
                        skill.setCertification((String) skillMap.get("certification"));
                        skill.setCredlyLink((String) skillMap.get("credlyLink"));
                        
                        // Set timestamps
                        LocalDateTime now = LocalDateTime.now();
                        skill.setCreatedAt(now);
                        skill.setUpdatedAt(now);
                        
                        skillRepository.save(skill);
                        imported++;
                    }
                    
                    // TODO: Create skill history entry for audit
                    
                } catch (Exception e) {
                    log.error("Error importing skill", e);
                    errors.add("Error importing skill at row " + (imported + updated + skipped + 1) + ": " + e.getMessage());
                }
            }
            
            result.put("success", true);
            result.put("imported", imported);
            result.put("updated", updated);
            result.put("skipped", skipped);
            result.put("errors", errors);
            
        } catch (Exception e) {
            log.error("Error importing skills", e);
            result.put("error", "Error importing skills: " + e.getMessage());
        }
        
        return result;
    }

    // Helper methods
    
    private boolean isValidFileType(String fileType) {
        return "csv".equalsIgnoreCase(fileType) || "json".equalsIgnoreCase(fileType);
    }
    
    private boolean isValidDataType(String dataType) {
        return "users".equalsIgnoreCase(dataType) || "skills".equalsIgnoreCase(dataType) ||
               "projects".equalsIgnoreCase(dataType) || "resources".equalsIgnoreCase(dataType);
    }
    
    private Map<String, Object> validateCsvFile(MultipartFile file, String dataType) {
        Map<String, Object> result = new HashMap<>();
        
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
            
            List<CSVRecord> records = csvParser.getRecords();
            
            if (records.isEmpty()) {
                result.put("error", "No data records found in CSV file");
                return result;
            }
            
            // Check required columns based on data type
            Set<String> headers = csvParser.getHeaderMap().keySet();
            Set<String> requiredColumns = getRequiredColumns(dataType);
            
            Set<String> missingColumns = new HashSet<>(requiredColumns);
            missingColumns.removeAll(headers);
            
            if (!missingColumns.isEmpty()) {
                result.put("error", "Missing required columns: " + String.join(", ", missingColumns));
                return result;
            }
            
            // Get sample data
            List<Map<String, String>> sampleData = new ArrayList<>();
            int sampleSize = Math.min(5, records.size());
            
            for (int i = 0; i < sampleSize; i++) {
                CSVRecord record = records.get(i);
                Map<String, String> row = new HashMap<>();
                
                for (String header : headers) {
                    row.put(header, record.get(header));
                }
                
                sampleData.add(row);
            }
            
            result.put("rowCount", records.size());
            result.put("sampleData", sampleData);
            
        } catch (IOException e) {
            log.error("Error validating CSV file", e);
            result.put("error", "Error reading CSV file: " + e.getMessage());
        }
        
        return result;
    }
    
    private Map<String, Object> validateJsonFile(MultipartFile file, String dataType) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            List<Map<String, Object>> data = objectMapper.readValue(
                    file.getInputStream(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );
            
            if (data.isEmpty()) {
                result.put("error", "No data records found in JSON file");
                return result;
            }
            
            // Check required fields based on data type
            Set<String> requiredFields = getRequiredColumns(dataType);
            
            // Check first record for required fields
            Map<String, Object> firstRecord = data.get(0);
            Set<String> missingFields = new HashSet<>(requiredFields);
            missingFields.removeAll(firstRecord.keySet());
            
            if (!missingFields.isEmpty()) {
                result.put("error", "Missing required fields: " + String.join(", ", missingFields));
                return result;
            }
            
            // Get sample data
            List<Map<String, Object>> sampleData = new ArrayList<>();
            int sampleSize = Math.min(5, data.size());
            
            for (int i = 0; i < sampleSize; i++) {
                sampleData.add(data.get(i));
            }
            
            result.put("rowCount", data.size());
            result.put("sampleData", sampleData);
            
        } catch (IOException e) {
            log.error("Error validating JSON file", e);
            result.put("error", "Error reading JSON file: " + e.getMessage());
        }
        
        return result;
    }
    
    private Set<String> getRequiredColumns(String dataType) {
        if ("users".equalsIgnoreCase(dataType)) {
            return new HashSet<>(Arrays.asList("email", "firstName", "lastName"));
        } else if ("skills".equalsIgnoreCase(dataType)) {
            return new HashSet<>(Arrays.asList("userId", "name", "category", "level"));
        } else if ("projects".equalsIgnoreCase(dataType)) {
            return new HashSet<>(Arrays.asList("name", "status"));
        } else if ("resources".equalsIgnoreCase(dataType)) {
            return new HashSet<>(Arrays.asList("projectId", "userId", "role"));
        } else {
            return Collections.emptySet();
        }
    }
    
    private List<Map<String, Object>> parseCsvToList(MultipartFile file, String dataType) throws IOException {
        List<Map<String, Object>> result = new ArrayList<>();
        
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser csvParser = new CSVParser(reader, CSVFormat.DEFAULT.withFirstRecordAsHeader())) {
            
            List<CSVRecord> records = csvParser.getRecords();
            Set<String> headers = csvParser.getHeaderMap().keySet();
            
            for (CSVRecord record : records) {
                Map<String, Object> row = new HashMap<>();
                
                for (String header : headers) {
                    row.put(header, record.get(header));
                }
                
                result.add(row);
            }
        }
        
        return result;
    }
    
    private List<Map<String, Object>> parseJsonToList(MultipartFile file, String dataType) throws IOException {
        return objectMapper.readValue(
                file.getInputStream(),
                new TypeReference<List<Map<String, Object>>>() {}
        );
    }
}