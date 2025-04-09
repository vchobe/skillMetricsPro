package com.skillmetrics.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataExportService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ProjectResourceRepository resourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ClientRepository clientRepository;
    private final SkillHistoryRepository skillHistoryRepository;
    
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");

    /**
     * Generate a filename for an export file
     */
    public String generateExportFilename(String prefix, String format) {
        String timestamp = LocalDateTime.now().format(DATE_FORMATTER);
        return prefix + "_export_" + timestamp + "." + format.toLowerCase();
    }

    /**
     * Export skills data
     * @param userId Optional user ID to filter skills by user
     */
    @Transactional(readOnly = true)
    public byte[] exportSkillsData(Long userId, String format) throws IOException {
        List<Skill> skills;
        
        if (userId != null) {
            skills = skillRepository.findByUserId(userId);
        } else {
            skills = skillRepository.findAll();
        }
        
        if ("json".equalsIgnoreCase(format)) {
            return exportToJson(skills);
        } else { // Default to CSV
            return exportSkillsToCsv(skills);
        }
    }

    /**
     * Export user data
     */
    @Transactional(readOnly = true)
    public byte[] exportUsersData(String format) throws IOException {
        List<User> users = userRepository.findAll();
        
        // Remove sensitive fields for export
        List<Map<String, Object>> sanitizedUsers = users.stream()
                .map(user -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", user.getId());
                    map.put("email", user.getEmail());
                    map.put("firstName", user.getFirstName());
                    map.put("lastName", user.getLastName());
                    map.put("role", user.getRole());
                    map.put("location", user.getLocation());
                    map.put("createdAt", user.getCreatedAt());
                    map.put("updatedAt", user.getUpdatedAt());
                    return map;
                })
                .collect(Collectors.toList());
        
        if ("json".equalsIgnoreCase(format)) {
            return exportToJson(sanitizedUsers);
        } else { // Default to CSV
            return exportUsersToCsv(sanitizedUsers);
        }
    }

    /**
     * Export projects data
     */
    @Transactional(readOnly = true)
    public byte[] exportProjectsData(String format) throws IOException {
        List<Project> projects = projectRepository.findAll();
        
        // Enrich project data with client names
        Map<Long, Client> clientMap = clientRepository.findAll().stream()
                .collect(Collectors.toMap(Client::getId, client -> client));
                
        List<Map<String, Object>> enrichedProjects = projects.stream()
                .map(project -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", project.getId());
                    map.put("name", project.getName());
                    map.put("description", project.getDescription());
                    map.put("clientId", project.getClientId());
                    
                    if (project.getClientId() != null && clientMap.containsKey(project.getClientId())) {
                        map.put("clientName", clientMap.get(project.getClientId()).getName());
                    } else {
                        map.put("clientName", null);
                    }
                    
                    map.put("startDate", project.getStartDate());
                    map.put("endDate", project.getEndDate());
                    map.put("status", project.getStatus());
                    map.put("location", project.getLocation());
                    map.put("createdAt", project.getCreatedAt());
                    
                    return map;
                })
                .collect(Collectors.toList());
        
        if ("json".equalsIgnoreCase(format)) {
            return exportToJson(enrichedProjects);
        } else { // Default to CSV
            return exportProjectsToCsv(enrichedProjects);
        }
    }

    /**
     * Export project resources data for a specific project
     */
    @Transactional(readOnly = true)
    public byte[] exportProjectResourcesData(Long projectId, String format) throws IOException {
        List<ProjectResource> resources = resourceRepository.findByProjectId(projectId);
        
        // Get user information for enrichment
        Map<Long, User> userMap = userRepository.findAllById(
                resources.stream().map(ProjectResource::getUserId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(User::getId, user -> user));
        
        // Enrich resource data
        List<Map<String, Object>> enrichedResources = resources.stream()
                .map(resource -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", resource.getId());
                    map.put("projectId", resource.getProjectId());
                    map.put("userId", resource.getUserId());
                    
                    User user = userMap.get(resource.getUserId());
                    if (user != null) {
                        map.put("userName", user.getFirstName() + " " + user.getLastName());
                        map.put("userEmail", user.getEmail());
                    } else {
                        map.put("userName", null);
                        map.put("userEmail", null);
                    }
                    
                    map.put("role", resource.getRole());
                    map.put("allocation", resource.getAllocation());
                    map.put("startDate", resource.getStartDate());
                    map.put("endDate", resource.getEndDate());
                    map.put("notes", resource.getNotes());
                    map.put("createdAt", resource.getCreatedAt());
                    
                    return map;
                })
                .collect(Collectors.toList());
        
        if ("json".equalsIgnoreCase(format)) {
            return exportToJson(enrichedResources);
        } else { // Default to CSV
            return exportResourcesToCsv(enrichedResources);
        }
    }

    /**
     * Export user projects data for a specific user
     */
    @Transactional(readOnly = true)
    public byte[] exportUserProjectsData(Long userId, String format) throws IOException {
        List<ProjectResource> resources = resourceRepository.findByUserId(userId);
        
        // Get project information for enrichment
        Map<Long, Project> projectMap = projectRepository.findAllById(
                resources.stream().map(ProjectResource::getProjectId).collect(Collectors.toList())
        ).stream().collect(Collectors.toMap(Project::getId, project -> project));
        
        // Get client information for enrichment
        Set<Long> clientIds = projectMap.values().stream()
                .map(Project::getClientId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        Map<Long, Client> clientMap = clientRepository.findAllById(clientIds)
                .stream().collect(Collectors.toMap(Client::getId, client -> client));
        
        // Enrich resource data
        List<Map<String, Object>> enrichedUserProjects = resources.stream()
                .map(resource -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("resourceId", resource.getId());
                    map.put("projectId", resource.getProjectId());
                    
                    Project project = projectMap.get(resource.getProjectId());
                    if (project != null) {
                        map.put("projectName", project.getName());
                        map.put("projectStatus", project.getStatus());
                        map.put("projectStartDate", project.getStartDate());
                        map.put("projectEndDate", project.getEndDate());
                        
                        if (project.getClientId() != null && clientMap.containsKey(project.getClientId())) {
                            map.put("clientName", clientMap.get(project.getClientId()).getName());
                        } else {
                            map.put("clientName", null);
                        }
                    } else {
                        map.put("projectName", null);
                        map.put("projectStatus", null);
                        map.put("projectStartDate", null);
                        map.put("projectEndDate", null);
                        map.put("clientName", null);
                    }
                    
                    map.put("role", resource.getRole());
                    map.put("allocation", resource.getAllocation());
                    map.put("startDate", resource.getStartDate());
                    map.put("endDate", resource.getEndDate());
                    map.put("notes", resource.getNotes());
                    
                    return map;
                })
                .collect(Collectors.toList());
        
        if ("json".equalsIgnoreCase(format)) {
            return exportToJson(enrichedUserProjects);
        } else { // Default to CSV
            return exportUserProjectsToCsv(enrichedUserProjects);
        }
    }

    /**
     * Export analytics data
     */
    @Transactional(readOnly = true)
    public byte[] exportAnalyticsData(String format) throws IOException {
        // Gather skill distribution by category
        List<Skill> allSkills = skillRepository.findAll();
        Map<String, Long> skillsByCategory = allSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        // Gather skill level distribution
        Map<String, Long> skillsByLevel = allSkills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        // Project resource allocation stats
        List<ProjectResource> allResources = resourceRepository.findAll();
        Map<Long, List<ProjectResource>> resourcesByProject = allResources.stream()
                .collect(Collectors.groupingBy(ProjectResource::getProjectId));
        
        List<Map<String, Object>> projectAllocationStats = new ArrayList<>();
        resourcesByProject.forEach((projectId, resources) -> {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project != null) {
                Map<String, Object> stat = new HashMap<>();
                stat.put("projectId", projectId);
                stat.put("projectName", project.getName());
                stat.put("resourceCount", resources.size());
                stat.put("averageAllocation", resources.stream()
                        .mapToDouble(r -> r.getAllocation() != null ? r.getAllocation() : 0)
                        .average()
                        .orElse(0));
                projectAllocationStats.add(stat);
            }
        });
        
        // Skills history data for trend analysis
        List<SkillHistory> skillHistory = skillHistoryRepository.findAll();
        Map<String, Long> skillChangesByMonth = skillHistory.stream()
                .collect(Collectors.groupingBy(
                        sh -> sh.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")), 
                        Collectors.counting()));
        
        // Compile analytics data
        Map<String, Object> analyticsData = new HashMap<>();
        analyticsData.put("skillsByCategory", skillsByCategory);
        analyticsData.put("skillsByLevel", skillsByLevel);
        analyticsData.put("projectAllocationStats", projectAllocationStats);
        analyticsData.put("skillChangesByMonth", skillChangesByMonth);
        analyticsData.put("totalUsers", userRepository.count());
        analyticsData.put("totalProjects", projectRepository.count());
        analyticsData.put("totalSkills", skillRepository.count());
        analyticsData.put("generatedAt", LocalDateTime.now());
        
        // Only support JSON for analytics due to complexity
        return exportToJson(analyticsData);
    }
    
    // Helper methods for exporting data to various formats
    
    private byte[] exportToJson(Object data) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputStream, data);
        return outputStream.toByteArray();
    }
    
    private byte[] exportSkillsToCsv(List<Skill> skills) throws IOException {
        String[] headers = {"ID", "User ID", "Name", "Category", "Level", "Description", "Certification", "Created At", "Updated At"};
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(headers))) {
            
            for (Skill skill : skills) {
                csvPrinter.printRecord(
                        skill.getId(),
                        skill.getUserId(),
                        skill.getName(),
                        skill.getCategory(),
                        skill.getLevel(),
                        skill.getDescription(),
                        skill.getCertification(),
                        skill.getCreatedAt(),
                        skill.getUpdatedAt()
                );
            }
        }
        
        return outputStream.toByteArray();
    }
    
    private byte[] exportUsersToCsv(List<Map<String, Object>> users) throws IOException {
        String[] headers = {"ID", "Email", "First Name", "Last Name", "Role", "Location", "Created At", "Updated At"};
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(headers))) {
            
            for (Map<String, Object> user : users) {
                csvPrinter.printRecord(
                        user.get("id"),
                        user.get("email"),
                        user.get("firstName"),
                        user.get("lastName"),
                        user.get("role"),
                        user.get("location"),
                        user.get("createdAt"),
                        user.get("updatedAt")
                );
            }
        }
        
        return outputStream.toByteArray();
    }
    
    private byte[] exportProjectsToCsv(List<Map<String, Object>> projects) throws IOException {
        String[] headers = {"ID", "Name", "Description", "Client ID", "Client Name", "Start Date", "End Date", "Status", "Location", "Created At"};
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(headers))) {
            
            for (Map<String, Object> project : projects) {
                csvPrinter.printRecord(
                        project.get("id"),
                        project.get("name"),
                        project.get("description"),
                        project.get("clientId"),
                        project.get("clientName"),
                        project.get("startDate"),
                        project.get("endDate"),
                        project.get("status"),
                        project.get("location"),
                        project.get("createdAt")
                );
            }
        }
        
        return outputStream.toByteArray();
    }
    
    private byte[] exportResourcesToCsv(List<Map<String, Object>> resources) throws IOException {
        String[] headers = {"ID", "Project ID", "User ID", "User Name", "User Email", "Role", "Allocation", "Start Date", "End Date", "Notes", "Created At"};
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(headers))) {
            
            for (Map<String, Object> resource : resources) {
                csvPrinter.printRecord(
                        resource.get("id"),
                        resource.get("projectId"),
                        resource.get("userId"),
                        resource.get("userName"),
                        resource.get("userEmail"),
                        resource.get("role"),
                        resource.get("allocation"),
                        resource.get("startDate"),
                        resource.get("endDate"),
                        resource.get("notes"),
                        resource.get("createdAt")
                );
            }
        }
        
        return outputStream.toByteArray();
    }
    
    private byte[] exportUserProjectsToCsv(List<Map<String, Object>> userProjects) throws IOException {
        String[] headers = {"Resource ID", "Project ID", "Project Name", "Project Status", "Client Name", "Role", "Allocation", "Start Date", "End Date", "Notes"};
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try (OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader(headers))) {
            
            for (Map<String, Object> userProject : userProjects) {
                csvPrinter.printRecord(
                        userProject.get("resourceId"),
                        userProject.get("projectId"),
                        userProject.get("projectName"),
                        userProject.get("projectStatus"),
                        userProject.get("clientName"),
                        userProject.get("role"),
                        userProject.get("allocation"),
                        userProject.get("startDate"),
                        userProject.get("endDate"),
                        userProject.get("notes")
                );
            }
        }
        
        return outputStream.toByteArray();
    }
}