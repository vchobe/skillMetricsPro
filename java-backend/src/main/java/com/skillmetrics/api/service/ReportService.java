package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.exception.BadRequestException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final SkillRepository skillRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectResourceRepository resourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final EndorsementRepository endorsementRepository;

    /**
     * Generate skill matrix report
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateSkillMatrixReport(String category, String level, Long projectId) {
        Map<String, Object> report = new HashMap<>();
        
        // Filter skills based on parameters
        List<Skill> skills = skillRepository.findAll();
        if (category != null && !category.isEmpty()) {
            skills = skills.stream()
                    .filter(skill -> category.equals(skill.getCategory()))
                    .collect(Collectors.toList());
        }
        
        if (level != null && !level.isEmpty()) {
            skills = skills.stream()
                    .filter(skill -> level.equals(skill.getLevel()))
                    .collect(Collectors.toList());
        }
        
        // If projectId is provided, only include skills from users assigned to the project
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
            
            List<ProjectResource> resources = resourceRepository.findByProjectId(projectId);
            List<Long> userIds = resources.stream()
                    .map(ProjectResource::getUserId)
                    .collect(Collectors.toList());
            
            skills = skills.stream()
                    .filter(skill -> userIds.contains(skill.getUserId()))
                    .collect(Collectors.toList());
            
            report.put("project", project);
        }
        
        // Generate skill distribution by category
        Map<String, Long> skillsByCategory = skills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        // Generate skill distribution by level
        Map<String, Long> skillsByLevel = skills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        // Generate skill distribution by user
        Map<Long, List<Skill>> skillsByUser = skills.stream()
                .collect(Collectors.groupingBy(Skill::getUserId));
        
        // Enrich with user information
        List<Map<String, Object>> userSkillMatrix = new ArrayList<>();
        skillsByUser.forEach((userId, userSkills) -> {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                Map<String, Object> userEntry = new HashMap<>();
                userEntry.put("userId", userId);
                userEntry.put("userName", user.getFirstName() + " " + user.getLastName());
                userEntry.put("userEmail", user.getEmail());
                userEntry.put("skillCount", userSkills.size());
                
                // Group skills by category and level for this user
                Map<String, Map<String, List<Skill>>> categoryLevelSkills = userSkills.stream()
                        .collect(Collectors.groupingBy(
                                Skill::getCategory,
                                Collectors.groupingBy(Skill::getLevel)
                        ));
                
                userEntry.put("skillMatrix", categoryLevelSkills);
                
                userSkillMatrix.add(userEntry);
            }
        });
        
        // Sort by skill count in descending order
        userSkillMatrix.sort((a, b) -> 
                Integer.compare((Integer) b.get("skillCount"), (Integer) a.get("skillCount")));
        
        report.put("totalSkills", skills.size());
        report.put("skillsByCategory", skillsByCategory);
        report.put("skillsByLevel", skillsByLevel);
        report.put("userSkillMatrix", userSkillMatrix);
        report.put("generatedAt", LocalDateTime.now());
        
        return report;
    }

    /**
     * Generate resource utilization report
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateResourceUtilizationReport(String startDateStr, String endDateStr, Long projectId) {
        Map<String, Object> report = new HashMap<>();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate startDate = startDateStr != null ? LocalDate.parse(startDateStr, formatter) : LocalDate.now().minusMonths(6);
        LocalDate endDate = endDateStr != null ? LocalDate.parse(endDateStr, formatter) : LocalDate.now();
        
        // Get all resources or filter by project
        List<ProjectResource> resources;
        if (projectId != null) {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
            
            resources = resourceRepository.findByProjectId(projectId);
            report.put("project", project);
        } else {
            resources = resourceRepository.findAll();
        }
        
        // Filter by date range
        resources = resources.stream()
                .filter(resource -> {
                    LocalDate resourceStart = resource.getStartDate() != null ? 
                            LocalDate.parse(resource.getStartDate(), formatter) : null;
                    LocalDate resourceEnd = resource.getEndDate() != null ? 
                            LocalDate.parse(resource.getEndDate(), formatter) : null;
                    
                    // Include if resource period overlaps with report period
                    return (resourceStart == null || !resourceStart.isAfter(endDate)) &&
                           (resourceEnd == null || !resourceEnd.isBefore(startDate));
                })
                .collect(Collectors.toList());
        
        // Calculate utilization stats
        List<Map<String, Object>> utilizationData = new ArrayList<>();
        Map<Long, Integer> userProjectCount = new HashMap<>();
        
        for (ProjectResource resource : resources) {
            // Count projects per user
            userProjectCount.put(
                    resource.getUserId(), 
                    userProjectCount.getOrDefault(resource.getUserId(), 0) + 1
            );
            
            // Get project and user info
            Project project = projectRepository.findById(resource.getProjectId()).orElse(null);
            User user = userRepository.findById(resource.getUserId()).orElse(null);
            
            if (project != null && user != null) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("resourceId", resource.getId());
                entry.put("projectId", project.getId());
                entry.put("projectName", project.getName());
                entry.put("userId", user.getId());
                entry.put("userName", user.getFirstName() + " " + user.getLastName());
                entry.put("role", resource.getRole());
                entry.put("allocation", resource.getAllocation());
                entry.put("startDate", resource.getStartDate());
                entry.put("endDate", resource.getEndDate());
                
                utilizationData.add(entry);
            }
        }
        
        // Calculate over-allocation (users with >100% total allocation)
        Map<Long, Double> totalAllocationByUser = new HashMap<>();
        Map<Long, List<Map<String, Object>>> resourcesByUser = new HashMap<>();
        
        for (Map<String, Object> entry : utilizationData) {
            Long userId = (Long) entry.get("userId");
            Double allocation = (Double) entry.get("allocation");
            
            if (allocation != null) {
                totalAllocationByUser.put(
                        userId,
                        totalAllocationByUser.getOrDefault(userId, 0.0) + allocation
                );
            }
            
            // Group resources by user
            if (!resourcesByUser.containsKey(userId)) {
                resourcesByUser.put(userId, new ArrayList<>());
            }
            resourcesByUser.get(userId).add(entry);
        }
        
        // Identify over-allocated users
        List<Map<String, Object>> overAllocatedUsers = new ArrayList<>();
        totalAllocationByUser.forEach((userId, totalAllocation) -> {
            if (totalAllocation > 100.0) {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    Map<String, Object> overAllocated = new HashMap<>();
                    overAllocated.put("userId", userId);
                    overAllocated.put("userName", user.getFirstName() + " " + user.getLastName());
                    overAllocated.put("totalAllocation", totalAllocation);
                    overAllocated.put("projectCount", userProjectCount.getOrDefault(userId, 0));
                    overAllocated.put("assignments", resourcesByUser.get(userId));
                    
                    overAllocatedUsers.add(overAllocated);
                }
            }
        });
        
        // Overall utilization statistics
        double totalUtilization = totalAllocationByUser.values().stream().mapToDouble(Double::doubleValue).sum();
        int totalResources = (int) totalAllocationByUser.keySet().stream().count();
        double averageUtilization = totalResources > 0 ? totalUtilization / totalResources : 0;
        
        // Group by role
        Map<String, List<Map<String, Object>>> utilizationByRole = utilizationData.stream()
                .collect(Collectors.groupingBy(entry -> (String) entry.get("role")));
        
        // Calculate role statistics
        Map<String, Map<String, Object>> roleStats = new HashMap<>();
        utilizationByRole.forEach((role, entries) -> {
            double roleAllocation = entries.stream()
                    .mapToDouble(entry -> entry.get("allocation") != null ? (Double) entry.get("allocation") : 0)
                    .sum();
            
            Map<String, Object> roleStat = new HashMap<>();
            roleStat.put("count", entries.size());
            roleStat.put("totalAllocation", roleAllocation);
            roleStat.put("averageAllocation", entries.size() > 0 ? roleAllocation / entries.size() : 0);
            
            roleStats.put(role, roleStat);
        });
        
        report.put("startDate", startDate);
        report.put("endDate", endDate);
        report.put("totalResources", totalResources);
        report.put("totalUtilization", totalUtilization);
        report.put("averageUtilization", averageUtilization);
        report.put("utilizationData", utilizationData);
        report.put("overAllocatedUsers", overAllocatedUsers);
        report.put("roleStatistics", roleStats);
        report.put("generatedAt", LocalDateTime.now());
        
        return report;
    }

    /**
     * Generate team capabilities report
     */
    @Transactional(readOnly = true)
    public Map<String, Object> generateTeamCapabilitiesReport(Long projectId, String teamId) {
        Map<String, Object> report = new HashMap<>();
        
        // Get team members
        List<User> teamMembers;
        List<ProjectResource> resources = new ArrayList<>();
        
        if (projectId != null) {
            // For a project team
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
            
            resources = resourceRepository.findByProjectId(projectId);
            List<Long> userIds = resources.stream()
                    .map(ProjectResource::getUserId)
                    .collect(Collectors.toList());
            
            teamMembers = userRepository.findAllByIdIn(userIds);
            report.put("project", project);
            report.put("teamSource", "project");
        } else if (teamId != null) {
            // For a functional team (department/location)
            teamMembers = userRepository.findByDepartmentOrLocation(teamId);
            report.put("teamName", teamId);
            report.put("teamSource", "functional");
        } else {
            // Default to all active users
            teamMembers = userRepository.findAll();
            report.put("teamSource", "all");
        }
        
        report.put("teamSize", teamMembers.size());
        
        // Get all skills for team members
        List<Skill> teamSkills = new ArrayList<>();
        Map<Long, List<Skill>> skillsByMember = new HashMap<>();
        
        for (User member : teamMembers) {
            List<Skill> userSkills = skillRepository.findByUserId(member.getId());
            teamSkills.addAll(userSkills);
            skillsByMember.put(member.getId(), userSkills);
        }
        
        // Skill distribution by category and level
        Map<String, Map<String, Long>> distributionByCategoryAndLevel = new HashMap<>();
        
        for (Skill skill : teamSkills) {
            String category = skill.getCategory();
            String level = skill.getLevel();
            
            distributionByCategoryAndLevel.putIfAbsent(category, new HashMap<>());
            Map<String, Long> levelCounts = distributionByCategoryAndLevel.get(category);
            levelCounts.put(level, levelCounts.getOrDefault(level, 0L) + 1);
        }
        
        // Top skills based on count and endorsements
        Map<String, List<Skill>> skillsByName = teamSkills.stream()
                .collect(Collectors.groupingBy(Skill::getName));
        
        List<Map<String, Object>> topSkills = new ArrayList<>();
        
        skillsByName.forEach((name, skills) -> {
            Map<String, Object> skillData = new HashMap<>();
            skillData.put("name", name);
            skillData.put("count", skills.size());
            
            // Get primary category
            Map<String, Long> categoryCounts = skills.stream()
                    .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
            
            String primaryCategory = categoryCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("");
            
            skillData.put("primaryCategory", primaryCategory);
            
            // Get levels distribution
            Map<String, Long> levelCounts = skills.stream()
                    .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
            
            skillData.put("levelDistribution", levelCounts);
            
            // Get endorsement count
            List<Long> skillIds = skills.stream().map(Skill::getId).collect(Collectors.toList());
            long endorsementCount = endorsementRepository.countBySkillIdIn(skillIds);
            
            skillData.put("endorsementCount", endorsementCount);
            
            topSkills.add(skillData);
        });
        
        // Sort by count, then by endorsements
        topSkills.sort((a, b) -> {
            int countCompare = Integer.compare((Integer) b.get("count"), (Integer) a.get("count"));
            if (countCompare != 0) {
                return countCompare;
            }
            return Long.compare((Long) b.get("endorsementCount"), (Long) a.get("endorsementCount"));
        });
        
        // Get only top 20
        List<Map<String, Object>> top20Skills = topSkills.size() > 20 
                ? topSkills.subList(0, 20) 
                : topSkills;
        
        // Skill gap analysis (only if project is specified)
        List<Map<String, Object>> skillGaps = new ArrayList<>();
        
        if (projectId != null) {
            List<ProjectSkill> requiredSkills = projectSkillRepository.findByProjectId(projectId);
            
            for (ProjectSkill requiredSkill : requiredSkills) {
                // Check if team has this skill
                boolean hasSkill = false;
                boolean hasRequiredLevel = false;
                
                for (Skill skill : teamSkills) {
                    if (skill.getName().equals(requiredSkill.getSkillName()) &&
                            skill.getCategory().equals(requiredSkill.getCategory())) {
                        hasSkill = true;
                        
                        // Check if any team member has required level or higher
                        if (compareSkillLevels(skill.getLevel(), requiredSkill.getRequiredLevel()) >= 0) {
                            hasRequiredLevel = true;
                            break;
                        }
                    }
                }
                
                if (!hasSkill || !hasRequiredLevel) {
                    Map<String, Object> gap = new HashMap<>();
                    gap.put("skillName", requiredSkill.getSkillName());
                    gap.put("category", requiredSkill.getCategory());
                    gap.put("requiredLevel", requiredSkill.getRequiredLevel());
                    gap.put("hasSkill", hasSkill);
                    gap.put("hasRequiredLevel", hasRequiredLevel);
                    
                    skillGaps.add(gap);
                }
            }
        }
        
        // Team member capabilities
        List<Map<String, Object>> memberCapabilities = new ArrayList<>();
        
        for (User member : teamMembers) {
            List<Skill> userSkills = skillsByMember.getOrDefault(member.getId(), Collections.emptyList());
            if (userSkills.isEmpty()) {
                continue;
            }
            
            Map<String, Object> memberData = new HashMap<>();
            memberData.put("userId", member.getId());
            memberData.put("name", member.getFirstName() + " " + member.getLastName());
            memberData.put("email", member.getEmail());
            memberData.put("skillCount", userSkills.size());
            
            // Get skill distribution by category and level
            Map<String, Map<String, Long>> userDistribution = new HashMap<>();
            for (Skill skill : userSkills) {
                String category = skill.getCategory();
                String level = skill.getLevel();
                
                userDistribution.putIfAbsent(category, new HashMap<>());
                Map<String, Long> levelCounts = userDistribution.get(category);
                levelCounts.put(level, levelCounts.getOrDefault(level, 0L) + 1);
            }
            
            memberData.put("skillDistribution", userDistribution);
            
            // Get top skills (by level and endorsements)
            List<Skill> topUserSkills = userSkills.stream()
                    .sorted(Comparator.comparing((Skill s) -> getLevelValue(s.getLevel())).reversed())
                    .limit(5)
                    .collect(Collectors.toList());
            
            memberData.put("topSkills", topUserSkills);
            
            // If project team, get role
            if (projectId != null) {
                for (ProjectResource resource : resources) {
                    if (resource.getUserId().equals(member.getId())) {
                        memberData.put("role", resource.getRole());
                        memberData.put("allocation", resource.getAllocation());
                        break;
                    }
                }
            }
            
            memberCapabilities.add(memberData);
        }
        
        // Sort by skill count
        memberCapabilities.sort((a, b) -> 
                Integer.compare((Integer) b.get("skillCount"), (Integer) a.get("skillCount")));
        
        report.put("distributionByCategoryAndLevel", distributionByCategoryAndLevel);
        report.put("topSkills", top20Skills);
        report.put("skillGaps", skillGaps);
        report.put("memberCapabilities", memberCapabilities);
        report.put("generatedAt", LocalDateTime.now());
        
        return report;
    }

    /**
     * Export a report as PDF
     */
    public Resource exportReportAsPdf(String reportType, Map<String, String> params) {
        // Generate the appropriate report data
        Map<String, Object> reportData;
        
        switch (reportType.toLowerCase()) {
            case "skill-matrix":
                reportData = generateSkillMatrixReport(
                        params.get("category"),
                        params.get("level"),
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null
                );
                break;
                
            case "resource-utilization":
                reportData = generateResourceUtilizationReport(
                        params.get("startDate"),
                        params.get("endDate"),
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null
                );
                break;
                
            case "team-capabilities":
                reportData = generateTeamCapabilitiesReport(
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null,
                        params.get("teamId")
                );
                break;
                
            default:
                throw new BadRequestException("Invalid report type: " + reportType);
        }
        
        // Create PDF document
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            document.open();
            
            // Add title
            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD);
            Paragraph title = new Paragraph(formatReportTitle(reportType), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            
            // Add generation timestamp
            Font timestampFont = new Font(Font.FontFamily.HELVETICA, 10, Font.ITALIC);
            Paragraph timestamp = new Paragraph("Generated: " + 
                    ((LocalDateTime) reportData.get("generatedAt")).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    timestampFont);
            timestamp.setAlignment(Element.ALIGN_CENTER);
            document.add(timestamp);
            
            document.add(Chunk.NEWLINE);
            
            // Add report content based on type
            switch (reportType.toLowerCase()) {
                case "skill-matrix":
                    addSkillMatrixPdfContent(document, reportData);
                    break;
                    
                case "resource-utilization":
                    addResourceUtilizationPdfContent(document, reportData);
                    break;
                    
                case "team-capabilities":
                    addTeamCapabilitiesPdfContent(document, reportData);
                    break;
            }
            
            document.close();
            writer.close();
        } catch (Exception e) {
            log.error("Error generating PDF report", e);
            throw new BadRequestException("Error generating PDF report: " + e.getMessage());
        }
        
        // Create the resource
        ByteArrayResource resource = new ByteArrayResource(baos.toByteArray()) {
            @Override
            public String getFilename() {
                return reportType.toLowerCase() + "-report-" + 
                        LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".pdf";
            }
        };
        
        return resource;
    }

    /**
     * Export a report as Excel
     */
    public Resource exportReportAsExcel(String reportType, Map<String, String> params) {
        // Generate the appropriate report data
        Map<String, Object> reportData;
        
        switch (reportType.toLowerCase()) {
            case "skill-matrix":
                reportData = generateSkillMatrixReport(
                        params.get("category"),
                        params.get("level"),
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null
                );
                break;
                
            case "resource-utilization":
                reportData = generateResourceUtilizationReport(
                        params.get("startDate"),
                        params.get("endDate"),
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null
                );
                break;
                
            case "team-capabilities":
                reportData = generateTeamCapabilitiesReport(
                        params.get("projectId") != null ? Long.parseLong(params.get("projectId")) : null,
                        params.get("teamId")
                );
                break;
                
            default:
                throw new BadRequestException("Invalid report type: " + reportType);
        }
        
        // Create Excel workbook
        Workbook workbook = new XSSFWorkbook();
        
        try {
            // Add sheets based on report type
            switch (reportType.toLowerCase()) {
                case "skill-matrix":
                    addSkillMatrixExcelContent(workbook, reportData);
                    break;
                    
                case "resource-utilization":
                    addResourceUtilizationExcelContent(workbook, reportData);
                    break;
                    
                case "team-capabilities":
                    addTeamCapabilitiesExcelContent(workbook, reportData);
                    break;
            }
            
            // Write to byte array
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            workbook.close();
            
            // Create the resource
            ByteArrayResource resource = new ByteArrayResource(baos.toByteArray()) {
                @Override
                public String getFilename() {
                    return reportType.toLowerCase() + "-report-" + 
                            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".xlsx";
                }
            };
            
            return resource;
        } catch (Exception e) {
            log.error("Error generating Excel report", e);
            throw new BadRequestException("Error generating Excel report: " + e.getMessage());
        }
    }

    // Helper methods
    
    private void addSkillMatrixPdfContent(Document document, Map<String, Object> reportData) throws DocumentException {
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        
        // Overview section
        Paragraph overview = new Paragraph("Overview", sectionFont);
        document.add(overview);
        document.add(Chunk.NEWLINE);
        
        // Summary statistics
        document.add(new Paragraph("Total Skills: " + reportData.get("totalSkills"), normalFont));
        
        // If project specified, include project info
        if (reportData.containsKey("project")) {
            Project project = (Project) reportData.get("project");
            document.add(new Paragraph("Project: " + project.getName(), normalFont));
            if (project.getDescription() != null) {
                document.add(new Paragraph("Description: " + project.getDescription(), normalFont));
            }
        }
        
        document.add(Chunk.NEWLINE);
        
        // Skills by Category
        Paragraph categoryTitle = new Paragraph("Skills by Category", sectionFont);
        document.add(categoryTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        Map<String, Long> skillsByCategory = (Map<String, Long>) reportData.get("skillsByCategory");
        
        PdfPTable categoryTable = new PdfPTable(2);
        categoryTable.setWidthPercentage(100);
        
        categoryTable.addCell(new PdfPCell(new Phrase("Category", boldFont)));
        categoryTable.addCell(new PdfPCell(new Phrase("Count", boldFont)));
        
        for (Map.Entry<String, Long> entry : skillsByCategory.entrySet()) {
            categoryTable.addCell(new PdfPCell(new Phrase(entry.getKey(), normalFont)));
            categoryTable.addCell(new PdfPCell(new Phrase(entry.getValue().toString(), normalFont)));
        }
        
        document.add(categoryTable);
        document.add(Chunk.NEWLINE);
        
        // Skills by Level
        Paragraph levelTitle = new Paragraph("Skills by Level", sectionFont);
        document.add(levelTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        Map<String, Long> skillsByLevel = (Map<String, Long>) reportData.get("skillsByLevel");
        
        PdfPTable levelTable = new PdfPTable(2);
        levelTable.setWidthPercentage(100);
        
        levelTable.addCell(new PdfPCell(new Phrase("Level", boldFont)));
        levelTable.addCell(new PdfPCell(new Phrase("Count", boldFont)));
        
        for (Map.Entry<String, Long> entry : skillsByLevel.entrySet()) {
            levelTable.addCell(new PdfPCell(new Phrase(entry.getKey(), normalFont)));
            levelTable.addCell(new PdfPCell(new Phrase(entry.getValue().toString(), normalFont)));
        }
        
        document.add(levelTable);
        document.add(Chunk.NEWLINE);
        
        // User Skill Matrix
        Paragraph userTitle = new Paragraph("User Skill Matrix", sectionFont);
        document.add(userTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> userSkillMatrix = (List<Map<String, Object>>) reportData.get("userSkillMatrix");
        
        for (Map<String, Object> userEntry : userSkillMatrix) {
            String userName = (String) userEntry.get("userName");
            Integer skillCount = (Integer) userEntry.get("skillCount");
            
            Paragraph userHeader = new Paragraph(userName + " (" + skillCount + " skills)", boldFont);
            document.add(userHeader);
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, List<Skill>>> skillMatrix = 
                    (Map<String, Map<String, List<Skill>>>) userEntry.get("skillMatrix");
            
            for (Map.Entry<String, Map<String, List<Skill>>> categoryEntry : skillMatrix.entrySet()) {
                String category = categoryEntry.getKey();
                Map<String, List<Skill>> levelMap = categoryEntry.getValue();
                
                document.add(new Paragraph("  Category: " + category, normalFont));
                
                for (Map.Entry<String, List<Skill>> levelEntry : levelMap.entrySet()) {
                    String level = levelEntry.getKey();
                    List<Skill> skills = levelEntry.getValue();
                    
                    document.add(new Paragraph("    Level: " + level + " (" + skills.size() + ")", normalFont));
                    
                    String skillNames = skills.stream()
                            .map(Skill::getName)
                            .collect(Collectors.joining(", "));
                    
                    document.add(new Paragraph("      " + skillNames, normalFont));
                }
            }
            
            document.add(Chunk.NEWLINE);
        }
    }
    
    private void addResourceUtilizationPdfContent(Document document, Map<String, Object> reportData) throws DocumentException {
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        
        // Overview section
        Paragraph overview = new Paragraph("Resource Utilization Overview", sectionFont);
        document.add(overview);
        document.add(Chunk.NEWLINE);
        
        // Summary statistics
        document.add(new Paragraph("Report Period: " + 
                reportData.get("startDate") + " to " + reportData.get("endDate"), normalFont));
        document.add(new Paragraph("Total Resources: " + reportData.get("totalResources"), normalFont));
        document.add(new Paragraph("Average Utilization: " + 
                String.format("%.2f%%", reportData.get("averageUtilization")), normalFont));
        
        // If project specified, include project info
        if (reportData.containsKey("project")) {
            Project project = (Project) reportData.get("project");
            document.add(new Paragraph("Project: " + project.getName(), normalFont));
            if (project.getDescription() != null) {
                document.add(new Paragraph("Description: " + project.getDescription(), normalFont));
            }
        }
        
        document.add(Chunk.NEWLINE);
        
        // Role statistics
        Paragraph rolesTitle = new Paragraph("Role Statistics", sectionFont);
        document.add(rolesTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> roleStats = (Map<String, Map<String, Object>>) reportData.get("roleStatistics");
        
        PdfPTable roleTable = new PdfPTable(4);
        roleTable.setWidthPercentage(100);
        
        roleTable.addCell(new PdfPCell(new Phrase("Role", boldFont)));
        roleTable.addCell(new PdfPCell(new Phrase("Count", boldFont)));
        roleTable.addCell(new PdfPCell(new Phrase("Total Allocation", boldFont)));
        roleTable.addCell(new PdfPCell(new Phrase("Average Allocation", boldFont)));
        
        for (Map.Entry<String, Map<String, Object>> entry : roleStats.entrySet()) {
            String role = entry.getKey();
            Map<String, Object> stats = entry.getValue();
            
            roleTable.addCell(new PdfPCell(new Phrase(role, normalFont)));
            roleTable.addCell(new PdfPCell(new Phrase(stats.get("count").toString(), normalFont)));
            roleTable.addCell(new PdfPCell(new Phrase(String.format("%.2f%%", stats.get("totalAllocation")), normalFont)));
            roleTable.addCell(new PdfPCell(new Phrase(String.format("%.2f%%", stats.get("averageAllocation")), normalFont)));
        }
        
        document.add(roleTable);
        document.add(Chunk.NEWLINE);
        
        // Over-allocated users
        Paragraph overAllocatedTitle = new Paragraph("Over-allocated Resources", sectionFont);
        document.add(overAllocatedTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> overAllocatedUsers = (List<Map<String, Object>>) reportData.get("overAllocatedUsers");
        
        if (overAllocatedUsers.isEmpty()) {
            document.add(new Paragraph("No over-allocated resources found.", normalFont));
        } else {
            PdfPTable overAllocatedTable = new PdfPTable(3);
            overAllocatedTable.setWidthPercentage(100);
            
            overAllocatedTable.addCell(new PdfPCell(new Phrase("User", boldFont)));
            overAllocatedTable.addCell(new PdfPCell(new Phrase("Total Allocation", boldFont)));
            overAllocatedTable.addCell(new PdfPCell(new Phrase("Project Count", boldFont)));
            
            for (Map<String, Object> user : overAllocatedUsers) {
                overAllocatedTable.addCell(new PdfPCell(new Phrase((String) user.get("userName"), normalFont)));
                overAllocatedTable.addCell(new PdfPCell(new Phrase(
                        String.format("%.2f%%", user.get("totalAllocation")), normalFont)));
                overAllocatedTable.addCell(new PdfPCell(new Phrase(user.get("projectCount").toString(), normalFont)));
            }
            
            document.add(overAllocatedTable);
        }
        
        document.add(Chunk.NEWLINE);
        
        // Detailed utilization data - limited to first 10 entries to avoid huge PDFs
        Paragraph utilizationTitle = new Paragraph("Resource Allocation Details (Top 10)", sectionFont);
        document.add(utilizationTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> utilizationData = (List<Map<String, Object>>) reportData.get("utilizationData");
        
        PdfPTable utilizationTable = new PdfPTable(5);
        utilizationTable.setWidthPercentage(100);
        
        utilizationTable.addCell(new PdfPCell(new Phrase("User", boldFont)));
        utilizationTable.addCell(new PdfPCell(new Phrase("Project", boldFont)));
        utilizationTable.addCell(new PdfPCell(new Phrase("Role", boldFont)));
        utilizationTable.addCell(new PdfPCell(new Phrase("Allocation", boldFont)));
        utilizationTable.addCell(new PdfPCell(new Phrase("Period", boldFont)));
        
        int limit = Math.min(10, utilizationData.size());
        for (int i = 0; i < limit; i++) {
            Map<String, Object> entry = utilizationData.get(i);
            
            utilizationTable.addCell(new PdfPCell(new Phrase((String) entry.get("userName"), normalFont)));
            utilizationTable.addCell(new PdfPCell(new Phrase((String) entry.get("projectName"), normalFont)));
            utilizationTable.addCell(new PdfPCell(new Phrase((String) entry.get("role"), normalFont)));
            
            Double allocation = (Double) entry.get("allocation");
            utilizationTable.addCell(new PdfPCell(new Phrase(
                    allocation != null ? String.format("%.2f%%", allocation) : "N/A", normalFont)));
            
            String period = "";
            if (entry.get("startDate") != null) {
                period += entry.get("startDate");
            } else {
                period += "N/A";
            }
            period += " to ";
            if (entry.get("endDate") != null) {
                period += entry.get("endDate");
            } else {
                period += "N/A";
            }
            
            utilizationTable.addCell(new PdfPCell(new Phrase(period, normalFont)));
        }
        
        document.add(utilizationTable);
    }
    
    private void addTeamCapabilitiesPdfContent(Document document, Map<String, Object> reportData) throws DocumentException {
        Font sectionFont = new Font(Font.FontFamily.HELVETICA, 14, Font.BOLD);
        Font normalFont = new Font(Font.FontFamily.HELVETICA, 10);
        Font boldFont = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
        
        // Overview section
        Paragraph overview = new Paragraph("Team Capabilities Overview", sectionFont);
        document.add(overview);
        document.add(Chunk.NEWLINE);
        
        // Team information
        String teamSource = (String) reportData.get("teamSource");
        switch (teamSource) {
            case "project":
                Project project = (Project) reportData.get("project");
                document.add(new Paragraph("Project Team: " + project.getName(), normalFont));
                if (project.getDescription() != null) {
                    document.add(new Paragraph("Description: " + project.getDescription(), normalFont));
                }
                break;
                
            case "functional":
                document.add(new Paragraph("Functional Team: " + reportData.get("teamName"), normalFont));
                break;
                
            case "all":
                document.add(new Paragraph("All Users", normalFont));
                break;
        }
        
        document.add(new Paragraph("Team Size: " + reportData.get("teamSize"), normalFont));
        document.add(Chunk.NEWLINE);
        
        // Top skills
        Paragraph topSkillsTitle = new Paragraph("Top Skills", sectionFont);
        document.add(topSkillsTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topSkills = (List<Map<String, Object>>) reportData.get("topSkills");
        
        PdfPTable skillsTable = new PdfPTable(4);
        skillsTable.setWidthPercentage(100);
        
        skillsTable.addCell(new PdfPCell(new Phrase("Skill", boldFont)));
        skillsTable.addCell(new PdfPCell(new Phrase("Category", boldFont)));
        skillsTable.addCell(new PdfPCell(new Phrase("Count", boldFont)));
        skillsTable.addCell(new PdfPCell(new Phrase("Endorsements", boldFont)));
        
        int limit = Math.min(10, topSkills.size());
        for (int i = 0; i < limit; i++) {
            Map<String, Object> skill = topSkills.get(i);
            
            skillsTable.addCell(new PdfPCell(new Phrase((String) skill.get("name"), normalFont)));
            skillsTable.addCell(new PdfPCell(new Phrase((String) skill.get("primaryCategory"), normalFont)));
            skillsTable.addCell(new PdfPCell(new Phrase(skill.get("count").toString(), normalFont)));
            skillsTable.addCell(new PdfPCell(new Phrase(skill.get("endorsementCount").toString(), normalFont)));
        }
        
        document.add(skillsTable);
        document.add(Chunk.NEWLINE);
        
        // Skill gaps (if project)
        if ("project".equals(teamSource)) {
            Paragraph gapsTitle = new Paragraph("Skill Gaps", sectionFont);
            document.add(gapsTitle);
            document.add(Chunk.NEWLINE);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> skillGaps = (List<Map<String, Object>>) reportData.get("skillGaps");
            
            if (skillGaps.isEmpty()) {
                document.add(new Paragraph("No skill gaps identified.", normalFont));
            } else {
                PdfPTable gapsTable = new PdfPTable(4);
                gapsTable.setWidthPercentage(100);
                
                gapsTable.addCell(new PdfPCell(new Phrase("Skill", boldFont)));
                gapsTable.addCell(new PdfPCell(new Phrase("Category", boldFont)));
                gapsTable.addCell(new PdfPCell(new Phrase("Required Level", boldFont)));
                gapsTable.addCell(new PdfPCell(new Phrase("Gap Type", boldFont)));
                
                for (Map<String, Object> gap : skillGaps) {
                    gapsTable.addCell(new PdfPCell(new Phrase((String) gap.get("skillName"), normalFont)));
                    gapsTable.addCell(new PdfPCell(new Phrase((String) gap.get("category"), normalFont)));
                    gapsTable.addCell(new PdfPCell(new Phrase((String) gap.get("requiredLevel"), normalFont)));
                    
                    String gapType;
                    if (!(Boolean) gap.get("hasSkill")) {
                        gapType = "Missing Skill";
                    } else {
                        gapType = "Insufficient Level";
                    }
                    
                    gapsTable.addCell(new PdfPCell(new Phrase(gapType, normalFont)));
                }
                
                document.add(gapsTable);
            }
            
            document.add(Chunk.NEWLINE);
        }
        
        // Member capabilities
        Paragraph membersTitle = new Paragraph("Team Member Capabilities", sectionFont);
        document.add(membersTitle);
        document.add(Chunk.NEWLINE);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> memberCapabilities = (List<Map<String, Object>>) reportData.get("memberCapabilities");
        
        int memberLimit = Math.min(5, memberCapabilities.size());
        for (int i = 0; i < memberLimit; i++) {
            Map<String, Object> member = memberCapabilities.get(i);
            
            Paragraph memberHeader = new Paragraph((String) member.get("name") + 
                    " (" + member.get("skillCount") + " skills)", boldFont);
            document.add(memberHeader);
            
            if (member.containsKey("role")) {
                document.add(new Paragraph("Role: " + member.get("role") + 
                        ", Allocation: " + member.get("allocation") + "%", normalFont));
            }
            
            document.add(new Paragraph("Top Skills:", normalFont));
            
            @SuppressWarnings("unchecked")
            List<Skill> topUserSkills = (List<Skill>) member.get("topSkills");
            
            for (Skill skill : topUserSkills) {
                document.add(new Paragraph("  • " + skill.getName() + " (" + 
                        skill.getCategory() + " - " + skill.getLevel() + ")", normalFont));
            }
            
            document.add(Chunk.NEWLINE);
        }
    }
    
    private void addSkillMatrixExcelContent(Workbook workbook, Map<String, Object> reportData) {
        // Create sheets
        Sheet overviewSheet = workbook.createSheet("Overview");
        Sheet detailsSheet = workbook.createSheet("User Details");
        
        // Create header styles
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        // Overview sheet
        int rowNum = 0;
        Row titleRow = overviewSheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Skill Matrix Report");
        titleCell.setCellStyle(headerStyle);
        
        // Basic info
        Row infoRow1 = overviewSheet.createRow(rowNum++);
        infoRow1.createCell(0).setCellValue("Generated At");
        infoRow1.createCell(1).setCellValue(((LocalDateTime) reportData.get("generatedAt"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        Row infoRow2 = overviewSheet.createRow(rowNum++);
        infoRow2.createCell(0).setCellValue("Total Skills");
        infoRow2.createCell(1).setCellValue((Integer) reportData.get("totalSkills"));
        
        // If project specified, include project info
        if (reportData.containsKey("project")) {
            Project project = (Project) reportData.get("project");
            Row projectRow = overviewSheet.createRow(rowNum++);
            projectRow.createCell(0).setCellValue("Project");
            projectRow.createCell(1).setCellValue(project.getName());
            
            if (project.getDescription() != null) {
                Row descRow = overviewSheet.createRow(rowNum++);
                descRow.createCell(0).setCellValue("Description");
                descRow.createCell(1).setCellValue(project.getDescription());
            }
        }
        
        rowNum++;
        
        // Skills by Category
        Row categoryHeaderRow = overviewSheet.createRow(rowNum++);
        categoryHeaderRow.createCell(0).setCellValue("Skills by Category");
        categoryHeaderRow.getCell(0).setCellStyle(headerStyle);
        
        Row categoryLabelsRow = overviewSheet.createRow(rowNum++);
        categoryLabelsRow.createCell(0).setCellValue("Category");
        categoryLabelsRow.createCell(1).setCellValue("Count");
        categoryLabelsRow.getCell(0).setCellStyle(headerStyle);
        categoryLabelsRow.getCell(1).setCellStyle(headerStyle);
        
        @SuppressWarnings("unchecked")
        Map<String, Long> skillsByCategory = (Map<String, Long>) reportData.get("skillsByCategory");
        
        for (Map.Entry<String, Long> entry : skillsByCategory.entrySet()) {
            Row dataRow = overviewSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue(entry.getKey());
            dataRow.createCell(1).setCellValue(entry.getValue());
        }
        
        rowNum++;
        
        // Skills by Level
        Row levelHeaderRow = overviewSheet.createRow(rowNum++);
        levelHeaderRow.createCell(0).setCellValue("Skills by Level");
        levelHeaderRow.getCell(0).setCellStyle(headerStyle);
        
        Row levelLabelsRow = overviewSheet.createRow(rowNum++);
        levelLabelsRow.createCell(0).setCellValue("Level");
        levelLabelsRow.createCell(1).setCellValue("Count");
        levelLabelsRow.getCell(0).setCellStyle(headerStyle);
        levelLabelsRow.getCell(1).setCellStyle(headerStyle);
        
        @SuppressWarnings("unchecked")
        Map<String, Long> skillsByLevel = (Map<String, Long>) reportData.get("skillsByLevel");
        
        for (Map.Entry<String, Long> entry : skillsByLevel.entrySet()) {
            Row dataRow = overviewSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue(entry.getKey());
            dataRow.createCell(1).setCellValue(entry.getValue());
        }
        
        // User details sheet
        rowNum = 0;
        Row userHeaderRow = detailsSheet.createRow(rowNum++);
        userHeaderRow.createCell(0).setCellValue("User");
        userHeaderRow.createCell(1).setCellValue("Email");
        userHeaderRow.createCell(2).setCellValue("Skill Count");
        userHeaderRow.createCell(3).setCellValue("Categories");
        userHeaderRow.createCell(4).setCellValue("Levels");
        
        userHeaderRow.getCell(0).setCellStyle(headerStyle);
        userHeaderRow.getCell(1).setCellStyle(headerStyle);
        userHeaderRow.getCell(2).setCellStyle(headerStyle);
        userHeaderRow.getCell(3).setCellStyle(headerStyle);
        userHeaderRow.getCell(4).setCellStyle(headerStyle);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> userSkillMatrix = (List<Map<String, Object>>) reportData.get("userSkillMatrix");
        
        for (Map<String, Object> userEntry : userSkillMatrix) {
            Row userRow = detailsSheet.createRow(rowNum++);
            userRow.createCell(0).setCellValue((String) userEntry.get("userName"));
            userRow.createCell(1).setCellValue((String) userEntry.get("userEmail"));
            userRow.createCell(2).setCellValue((Integer) userEntry.get("skillCount"));
            
            @SuppressWarnings("unchecked")
            Map<String, Map<String, List<Skill>>> skillMatrix = 
                    (Map<String, Map<String, List<Skill>>>) userEntry.get("skillMatrix");
            
            userRow.createCell(3).setCellValue(String.join(", ", skillMatrix.keySet()));
            
            Set<String> allLevels = new HashSet<>();
            for (Map<String, List<Skill>> levelMap : skillMatrix.values()) {
                allLevels.addAll(levelMap.keySet());
            }
            
            userRow.createCell(4).setCellValue(String.join(", ", allLevels));
        }
        
        // Auto-size columns
        for (int i = 0; i < 5; i++) {
            overviewSheet.autoSizeColumn(i);
            detailsSheet.autoSizeColumn(i);
        }
    }
    
    private void addResourceUtilizationExcelContent(Workbook workbook, Map<String, Object> reportData) {
        // Create sheets
        Sheet overviewSheet = workbook.createSheet("Overview");
        Sheet detailsSheet = workbook.createSheet("Resource Details");
        Sheet overAllocatedSheet = workbook.createSheet("Over-allocated");
        
        // Create header styles
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        // Overview sheet
        int rowNum = 0;
        Row titleRow = overviewSheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Resource Utilization Report");
        titleCell.setCellStyle(headerStyle);
        
        // Basic info
        Row infoRow1 = overviewSheet.createRow(rowNum++);
        infoRow1.createCell(0).setCellValue("Generated At");
        infoRow1.createCell(1).setCellValue(((LocalDateTime) reportData.get("generatedAt"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        Row infoRow2 = overviewSheet.createRow(rowNum++);
        infoRow2.createCell(0).setCellValue("Report Period");
        infoRow2.createCell(1).setCellValue(reportData.get("startDate") + " to " + reportData.get("endDate"));
        
        Row infoRow3 = overviewSheet.createRow(rowNum++);
        infoRow3.createCell(0).setCellValue("Total Resources");
        infoRow3.createCell(1).setCellValue((Integer) reportData.get("totalResources"));
        
        Row infoRow4 = overviewSheet.createRow(rowNum++);
        infoRow4.createCell(0).setCellValue("Average Utilization");
        infoRow4.createCell(1).setCellValue(String.format("%.2f%%", reportData.get("averageUtilization")));
        
        // If project specified, include project info
        if (reportData.containsKey("project")) {
            Project project = (Project) reportData.get("project");
            Row projectRow = overviewSheet.createRow(rowNum++);
            projectRow.createCell(0).setCellValue("Project");
            projectRow.createCell(1).setCellValue(project.getName());
            
            if (project.getDescription() != null) {
                Row descRow = overviewSheet.createRow(rowNum++);
                descRow.createCell(0).setCellValue("Description");
                descRow.createCell(1).setCellValue(project.getDescription());
            }
        }
        
        rowNum++;
        
        // Role Statistics
        Row roleHeaderRow = overviewSheet.createRow(rowNum++);
        roleHeaderRow.createCell(0).setCellValue("Role Statistics");
        roleHeaderRow.getCell(0).setCellStyle(headerStyle);
        
        Row roleLabelRow = overviewSheet.createRow(rowNum++);
        roleLabelRow.createCell(0).setCellValue("Role");
        roleLabelRow.createCell(1).setCellValue("Count");
        roleLabelRow.createCell(2).setCellValue("Total Allocation");
        roleLabelRow.createCell(3).setCellValue("Average Allocation");
        
        roleLabelRow.getCell(0).setCellStyle(headerStyle);
        roleLabelRow.getCell(1).setCellStyle(headerStyle);
        roleLabelRow.getCell(2).setCellStyle(headerStyle);
        roleLabelRow.getCell(3).setCellStyle(headerStyle);
        
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> roleStats = (Map<String, Map<String, Object>>) reportData.get("roleStatistics");
        
        for (Map.Entry<String, Map<String, Object>> entry : roleStats.entrySet()) {
            String role = entry.getKey();
            Map<String, Object> stats = entry.getValue();
            
            Row dataRow = overviewSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue(role);
            dataRow.createCell(1).setCellValue(((Integer) stats.get("count")).doubleValue());
            dataRow.createCell(2).setCellValue(String.format("%.2f%%", stats.get("totalAllocation")));
            dataRow.createCell(3).setCellValue(String.format("%.2f%%", stats.get("averageAllocation")));
        }
        
        // Details sheet
        rowNum = 0;
        Row detailsHeaderRow = detailsSheet.createRow(rowNum++);
        detailsHeaderRow.createCell(0).setCellValue("User");
        detailsHeaderRow.createCell(1).setCellValue("Project");
        detailsHeaderRow.createCell(2).setCellValue("Role");
        detailsHeaderRow.createCell(3).setCellValue("Allocation");
        detailsHeaderRow.createCell(4).setCellValue("Start Date");
        detailsHeaderRow.createCell(5).setCellValue("End Date");
        
        for (int i = 0; i <= 5; i++) {
            detailsHeaderRow.getCell(i).setCellStyle(headerStyle);
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> utilizationData = (List<Map<String, Object>>) reportData.get("utilizationData");
        
        for (Map<String, Object> entry : utilizationData) {
            Row dataRow = detailsSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue((String) entry.get("userName"));
            dataRow.createCell(1).setCellValue((String) entry.get("projectName"));
            dataRow.createCell(2).setCellValue((String) entry.get("role"));
            
            Double allocation = (Double) entry.get("allocation");
            dataRow.createCell(3).setCellValue(allocation != null ? allocation : 0);
            
            dataRow.createCell(4).setCellValue((String) entry.get("startDate"));
            dataRow.createCell(5).setCellValue((String) entry.get("endDate"));
        }
        
        // Over-allocated sheet
        rowNum = 0;
        Row overAllocatedHeaderRow = overAllocatedSheet.createRow(rowNum++);
        overAllocatedHeaderRow.createCell(0).setCellValue("User");
        overAllocatedHeaderRow.createCell(1).setCellValue("Total Allocation");
        overAllocatedHeaderRow.createCell(2).setCellValue("Project Count");
        
        for (int i = 0; i <= 2; i++) {
            overAllocatedHeaderRow.getCell(i).setCellStyle(headerStyle);
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> overAllocatedUsers = (List<Map<String, Object>>) reportData.get("overAllocatedUsers");
        
        for (Map<String, Object> user : overAllocatedUsers) {
            Row dataRow = overAllocatedSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue((String) user.get("userName"));
            dataRow.createCell(1).setCellValue(((Double) user.get("totalAllocation")).doubleValue());
            dataRow.createCell(2).setCellValue(((Integer) user.get("projectCount")).doubleValue());
        }
        
        // Auto-size columns
        for (int i = 0; i < 6; i++) {
            if (i < 4) overviewSheet.autoSizeColumn(i);
            if (i < 6) detailsSheet.autoSizeColumn(i);
            if (i < 3) overAllocatedSheet.autoSizeColumn(i);
        }
    }
    
    private void addTeamCapabilitiesExcelContent(Workbook workbook, Map<String, Object> reportData) {
        // Create sheets
        Sheet overviewSheet = workbook.createSheet("Overview");
        Sheet skillsSheet = workbook.createSheet("Top Skills");
        Sheet memberSheet = workbook.createSheet("Team Members");
        Sheet gapsSheet = workbook.createSheet("Skill Gaps");
        
        // Create header styles
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        
        // Overview sheet
        int rowNum = 0;
        Row titleRow = overviewSheet.createRow(rowNum++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Team Capabilities Report");
        titleCell.setCellStyle(headerStyle);
        
        // Team information
        String teamSource = (String) reportData.get("teamSource");
        Row sourceRow = overviewSheet.createRow(rowNum++);
        sourceRow.createCell(0).setCellValue("Team Type");
        
        switch (teamSource) {
            case "project":
                Project project = (Project) reportData.get("project");
                sourceRow.createCell(1).setCellValue("Project Team");
                
                Row projectRow = overviewSheet.createRow(rowNum++);
                projectRow.createCell(0).setCellValue("Project Name");
                projectRow.createCell(1).setCellValue(project.getName());
                
                if (project.getDescription() != null) {
                    Row descRow = overviewSheet.createRow(rowNum++);
                    descRow.createCell(0).setCellValue("Description");
                    descRow.createCell(1).setCellValue(project.getDescription());
                }
                break;
                
            case "functional":
                sourceRow.createCell(1).setCellValue("Functional Team");
                
                Row teamRow = overviewSheet.createRow(rowNum++);
                teamRow.createCell(0).setCellValue("Team Name");
                teamRow.createCell(1).setCellValue((String) reportData.get("teamName"));
                break;
                
            case "all":
                sourceRow.createCell(1).setCellValue("All Users");
                break;
        }
        
        Row sizeRow = overviewSheet.createRow(rowNum++);
        sizeRow.createCell(0).setCellValue("Team Size");
        sizeRow.createCell(1).setCellValue(((Integer) reportData.get("teamSize")).doubleValue());
        
        Row genRow = overviewSheet.createRow(rowNum++);
        genRow.createCell(0).setCellValue("Generated At");
        genRow.createCell(1).setCellValue(((LocalDateTime) reportData.get("generatedAt"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        rowNum++;
        
        // Skills by category/level summary
        Row catLevelHeaderRow = overviewSheet.createRow(rowNum++);
        catLevelHeaderRow.createCell(0).setCellValue("Skill Distribution by Category and Level");
        catLevelHeaderRow.getCell(0).setCellStyle(headerStyle);
        
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Long>> distributionByCategoryAndLevel = 
                (Map<String, Map<String, Long>>) reportData.get("distributionByCategoryAndLevel");
        
        // Get all unique levels
        Set<String> allLevels = new HashSet<>();
        for (Map<String, Long> levelMap : distributionByCategoryAndLevel.values()) {
            allLevels.addAll(levelMap.keySet());
        }
        List<String> levelsList = new ArrayList<>(allLevels);
        Collections.sort(levelsList);
        
        // Create header row with levels
        Row levelHeaderRow = overviewSheet.createRow(rowNum++);
        levelHeaderRow.createCell(0).setCellValue("Category");
        levelHeaderRow.getCell(0).setCellStyle(headerStyle);
        
        for (int i = 0; i < levelsList.size(); i++) {
            levelHeaderRow.createCell(i + 1).setCellValue(levelsList.get(i));
            levelHeaderRow.getCell(i + 1).setCellStyle(headerStyle);
        }
        
        // Fill in data
        for (Map.Entry<String, Map<String, Long>> categoryEntry : distributionByCategoryAndLevel.entrySet()) {
            Row dataRow = overviewSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue(categoryEntry.getKey());
            
            Map<String, Long> levelData = categoryEntry.getValue();
            
            for (int i = 0; i < levelsList.size(); i++) {
                String level = levelsList.get(i);
                Long count = levelData.getOrDefault(level, 0L);
                dataRow.createCell(i + 1).setCellValue(count);
            }
        }
        
        // Top Skills sheet
        rowNum = 0;
        Row skillsHeaderRow = skillsSheet.createRow(rowNum++);
        skillsHeaderRow.createCell(0).setCellValue("Skill Name");
        skillsHeaderRow.createCell(1).setCellValue("Category");
        skillsHeaderRow.createCell(2).setCellValue("User Count");
        skillsHeaderRow.createCell(3).setCellValue("Endorsements");
        
        for (int i = 0; i <= 3; i++) {
            skillsHeaderRow.getCell(i).setCellStyle(headerStyle);
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> topSkills = (List<Map<String, Object>>) reportData.get("topSkills");
        
        for (Map<String, Object> skill : topSkills) {
            Row dataRow = skillsSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue((String) skill.get("name"));
            dataRow.createCell(1).setCellValue((String) skill.get("primaryCategory"));
            dataRow.createCell(2).setCellValue(((Integer) skill.get("count")).doubleValue());
            dataRow.createCell(3).setCellValue(((Long) skill.get("endorsementCount")).doubleValue());
            
            @SuppressWarnings("unchecked")
            Map<String, Long> levelDistribution = (Map<String, Long>) skill.get("levelDistribution");
            
            // Add level distribution columns if present
            if (levelDistribution != null) {
                int cellIdx = 4;
                for (Map.Entry<String, Long> level : levelDistribution.entrySet()) {
                    if (rowNum == 2) { // Add headers on first data row
                        skillsHeaderRow.createCell(cellIdx).setCellValue(level.getKey() + " Count");
                        skillsHeaderRow.getCell(cellIdx).setCellStyle(headerStyle);
                    }
                    dataRow.createCell(cellIdx++).setCellValue(level.getValue());
                }
            }
        }
        
        // Team Members sheet
        rowNum = 0;
        Row membersHeaderRow = memberSheet.createRow(rowNum++);
        membersHeaderRow.createCell(0).setCellValue("Name");
        membersHeaderRow.createCell(1).setCellValue("Email");
        membersHeaderRow.createCell(2).setCellValue("Skill Count");
        membersHeaderRow.createCell(3).setCellValue("Top Skills");
        
        if ("project".equals(teamSource)) {
            membersHeaderRow.createCell(4).setCellValue("Role");
            membersHeaderRow.createCell(5).setCellValue("Allocation");
        }
        
        for (int i = 0; i <= 5; i++) {
            if (i < 4 || "project".equals(teamSource)) {
                membersHeaderRow.getCell(i).setCellStyle(headerStyle);
            }
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> memberCapabilities = (List<Map<String, Object>>) reportData.get("memberCapabilities");
        
        for (Map<String, Object> member : memberCapabilities) {
            Row dataRow = memberSheet.createRow(rowNum++);
            dataRow.createCell(0).setCellValue((String) member.get("name"));
            dataRow.createCell(1).setCellValue((String) member.get("email"));
            dataRow.createCell(2).setCellValue(((Integer) member.get("skillCount")).doubleValue());
            
            // Top skills as comma-separated list
            @SuppressWarnings("unchecked")
            List<Skill> topUserSkills = (List<Skill>) member.get("topSkills");
            
            String skillsStr = topUserSkills.stream()
                    .map(skill -> skill.getName() + " (" + skill.getLevel() + ")")
                    .collect(Collectors.joining(", "));
            
            dataRow.createCell(3).setCellValue(skillsStr);
            
            // Add role and allocation if project team
            if ("project".equals(teamSource) && member.containsKey("role")) {
                dataRow.createCell(4).setCellValue((String) member.get("role"));
                
                if (member.containsKey("allocation")) {
                    dataRow.createCell(5).setCellValue(((Double) member.get("allocation")).doubleValue());
                }
            }
        }
        
        // Skill Gaps sheet (if project)
        if ("project".equals(teamSource)) {
            rowNum = 0;
            Row gapsHeaderRow = gapsSheet.createRow(rowNum++);
            gapsHeaderRow.createCell(0).setCellValue("Skill Name");
            gapsHeaderRow.createCell(1).setCellValue("Category");
            gapsHeaderRow.createCell(2).setCellValue("Required Level");
            gapsHeaderRow.createCell(3).setCellValue("Gap Type");
            
            for (int i = 0; i <= 3; i++) {
                gapsHeaderRow.getCell(i).setCellStyle(headerStyle);
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> skillGaps = (List<Map<String, Object>>) reportData.get("skillGaps");
            
            for (Map<String, Object> gap : skillGaps) {
                Row dataRow = gapsSheet.createRow(rowNum++);
                dataRow.createCell(0).setCellValue((String) gap.get("skillName"));
                dataRow.createCell(1).setCellValue((String) gap.get("category"));
                dataRow.createCell(2).setCellValue((String) gap.get("requiredLevel"));
                
                String gapType;
                if (!(Boolean) gap.get("hasSkill")) {
                    gapType = "Missing Skill";
                } else {
                    gapType = "Insufficient Level";
                }
                
                dataRow.createCell(3).setCellValue(gapType);
            }
        }
        
        // Auto-size columns
        for (int i = 0; i < 6; i++) {
            if (i < 6) overviewSheet.autoSizeColumn(i);
            if (i < 6) skillsSheet.autoSizeColumn(i);
            if (i < 6) memberSheet.autoSizeColumn(i);
            if (i < 4) gapsSheet.autoSizeColumn(i);
        }
    }
    
    private String formatReportTitle(String reportType) {
        switch (reportType.toLowerCase()) {
            case "skill-matrix":
                return "Skill Matrix Report";
                
            case "resource-utilization":
                return "Resource Utilization Report";
                
            case "team-capabilities":
                return "Team Capabilities Report";
                
            default:
                return "Report";
        }
    }
    
    private int getLevelValue(String level) {
        switch (level.toUpperCase()) {
            case "BEGINNER":
                return 1;
            case "INTERMEDIATE":
                return 2;
            case "ADVANCED":
                return 3;
            case "EXPERT":
                return 4;
            default:
                return 0;
        }
    }
    
    private int compareSkillLevels(String level1, String level2) {
        return getLevelValue(level1) - getLevelValue(level2);
    }
}