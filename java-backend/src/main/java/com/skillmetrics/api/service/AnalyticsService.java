package com.skillmetrics.api.service;

import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ProjectResourceRepository resourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final SkillHistoryRepository skillHistoryRepository;
    private final EndorsementRepository endorsementRepository;
    private final SkillTargetRepository skillTargetRepository;
    private final PendingSkillUpdateRepository pendingSkillUpdateRepository;

    /**
     * Get overview of system analytics
     */
    @Cacheable(value = "analyticsCache", key = "'overview'")
    @Transactional(readOnly = true)
    public Map<String, Object> getOverviewAnalytics() {
        Map<String, Object> result = new HashMap<>();
        
        // Count total users, skills, projects, etc.
        result.put("totalUsers", userRepository.count());
        result.put("totalSkills", skillRepository.count());
        result.put("totalProjects", projectRepository.count());
        result.put("totalEndorsements", endorsementRepository.count());
        
        // Count by status
        Map<String, Long> projectsByStatus = projectRepository.findAll().stream()
                .collect(Collectors.groupingBy(Project::getStatus, Collectors.counting()));
        result.put("projectsByStatus", projectsByStatus);
        
        // Count pending skill updates
        result.put("pendingSkillUpdates", pendingSkillUpdateRepository.countPendingUpdates());
        
        // Count skill targets by status
        Map<String, Long> skillTargetsByStatus = skillTargetRepository.findAll().stream()
                .collect(Collectors.groupingBy(SkillTarget::getStatus, Collectors.counting()));
        result.put("skillTargetsByStatus", skillTargetsByStatus);
        
        return result;
    }

    /**
     * Get skill distribution by category
     */
    @Cacheable(value = "analyticsCache", key = "'skillsByCategory'")
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillDistributionByCategory() {
        Map<String, Object> result = new HashMap<>();
        
        List<Skill> allSkills = skillRepository.findAll();
        
        // Get distribution by category
        Map<String, Long> distributionByCategory = allSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        // Calculate percentages
        long total = allSkills.size();
        Map<String, Double> percentageByCategory = new HashMap<>();
        
        distributionByCategory.forEach((category, count) -> {
            percentageByCategory.put(category, (count.doubleValue() / total) * 100);
        });
        
        result.put("total", total);
        result.put("distribution", distributionByCategory);
        result.put("percentage", percentageByCategory);
        
        return result;
    }

    /**
     * Get skill distribution by level
     */
    @Cacheable(value = "analyticsCache", key = "'skillsByLevel'")
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillDistributionByLevel() {
        Map<String, Object> result = new HashMap<>();
        
        List<Skill> allSkills = skillRepository.findAll();
        
        // Get distribution by level
        Map<String, Long> distributionByLevel = allSkills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        // Calculate percentages
        long total = allSkills.size();
        Map<String, Double> percentageByLevel = new HashMap<>();
        
        distributionByLevel.forEach((level, count) -> {
            percentageByLevel.put(level, (count.doubleValue() / total) * 100);
        });
        
        result.put("total", total);
        result.put("distribution", distributionByLevel);
        result.put("percentage", percentageByLevel);
        
        return result;
    }

    /**
     * Get skill growth over time
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillGrowthOverTime(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new HashMap<>();
        
        // Set default dates if not provided
        LocalDateTime start = startDate != null 
                ? startDate.atStartOfDay() 
                : LocalDateTime.now().minusMonths(6);
        
        LocalDateTime end = endDate != null 
                ? endDate.atTime(23, 59, 59) 
                : LocalDateTime.now();
        
        // Get all skills created within date range
        List<Skill> skills = skillRepository.findAll().stream()
                .filter(skill -> skill.getCreatedAt().isAfter(start) && skill.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());
        
        // Group by month
        Map<String, Long> skillsByMonth = skills.stream()
                .collect(Collectors.groupingBy(
                        skill -> skill.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        
        // Get skill history for changes within date range
        List<SkillHistory> history = skillHistoryRepository.findAll().stream()
                .filter(h -> h.getCreatedAt().isAfter(start) && h.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());
        
        // Group history by month
        Map<String, Long> changesByMonth = history.stream()
                .collect(Collectors.groupingBy(
                        h -> h.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        
        result.put("startDate", start.toLocalDate());
        result.put("endDate", end.toLocalDate());
        result.put("skillsByMonth", skillsByMonth);
        result.put("changesByMonth", changesByMonth);
        
        return result;
    }

    /**
     * Get top skills by user count
     */
    @Cacheable(value = "analyticsCache", key = "'topSkills'")
    @Transactional(readOnly = true)
    public Map<String, Object> getTopSkills(int limit) {
        Map<String, Object> result = new HashMap<>();
        
        List<Skill> allSkills = skillRepository.findAll();
        
        // Group skills by name and category
        Map<String, List<Skill>> skillGroups = allSkills.stream()
                .collect(Collectors.groupingBy(skill -> skill.getName() + "|" + skill.getCategory()));
        
        // Sort by count in descending order
        List<Map<String, Object>> topSkills = skillGroups.entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("\\|");
                    String name = parts[0];
                    String category = parts.length > 1 ? parts[1] : "";
                    List<Skill> skills = entry.getValue();
                    
                    Map<String, Object> skillData = new HashMap<>();
                    skillData.put("name", name);
                    skillData.put("category", category);
                    skillData.put("count", skills.size());
                    
                    // Get level distribution
                    Map<String, Long> levelDistribution = skills.stream()
                            .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
                    skillData.put("levelDistribution", levelDistribution);
                    
                    return skillData;
                })
                .sorted(Comparator.comparingInt(skill -> -((Integer) ((Map<String, Object>) skill).get("count"))))
                .limit(limit)
                .collect(Collectors.toList());
        
        result.put("topSkills", topSkills);
        
        return result;
    }

    /**
     * Get skill gap analysis (skills needed vs. available)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillGapAnalysis() {
        Map<String, Object> result = new HashMap<>();
        
        // Get all project skills (required skills)
        List<ProjectSkill> projectSkills = projectSkillRepository.findAll();
        
        // Group project skills by name and category
        Map<String, List<ProjectSkill>> requiredSkills = projectSkills.stream()
                .collect(Collectors.groupingBy(
                        projectSkill -> projectSkill.getSkillName() + "|" + projectSkill.getCategory()
                ));
        
        // Get all employee skills
        List<Skill> employeeSkills = skillRepository.findAll();
        
        // Group employee skills by name and category
        Map<String, List<Skill>> availableSkills = employeeSkills.stream()
                .collect(Collectors.groupingBy(
                        skill -> skill.getName() + "|" + skill.getCategory()
                ));
        
        // Find gaps and overlaps
        List<Map<String, Object>> gaps = new ArrayList<>();
        List<Map<String, Object>> overlaps = new ArrayList<>();
        
        requiredSkills.forEach((key, required) -> {
            String[] parts = key.split("\\|");
            String name = parts[0];
            String category = parts.length > 1 ? parts[1] : "";
            
            Map<String, Object> skillData = new HashMap<>();
            skillData.put("name", name);
            skillData.put("category", category);
            skillData.put("requiredCount", required.size());
            
            List<Skill> available = availableSkills.getOrDefault(key, Collections.emptyList());
            skillData.put("availableCount", available.size());
            
            int diff = available.size() - required.size();
            skillData.put("gap", diff);
            
            if (diff < 0) {
                gaps.add(skillData);
            } else if (diff > 0) {
                overlaps.add(skillData);
            }
        });
        
        // Sort gaps by largest deficit
        gaps.sort(Comparator.comparingInt(gap -> (Integer) gap.get("gap")));
        
        // Sort overlaps by largest surplus
        overlaps.sort(Comparator.comparingInt(overlap -> -((Integer) overlap.get("gap"))));
        
        result.put("gaps", gaps);
        result.put("overlaps", overlaps);
        
        return result;
    }

    /**
     * Get project resource allocation statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectAllocationStats() {
        Map<String, Object> result = new HashMap<>();
        
        List<Project> projects = projectRepository.findAll();
        List<Map<String, Object>> projectStats = new ArrayList<>();
        
        for (Project project : projects) {
            List<ProjectResource> resources = resourceRepository.findByProjectId(project.getId());
            
            if (resources.isEmpty()) {
                continue;
            }
            
            Map<String, Object> projectData = new HashMap<>();
            projectData.put("projectId", project.getId());
            projectData.put("projectName", project.getName());
            projectData.put("status", project.getStatus());
            projectData.put("resourceCount", resources.size());
            
            double totalAllocation = resources.stream()
                    .mapToDouble(resource -> resource.getAllocation() != null ? resource.getAllocation() : 0)
                    .sum();
            
            double averageAllocation = totalAllocation / resources.size();
            
            projectData.put("totalAllocation", totalAllocation);
            projectData.put("averageAllocation", averageAllocation);
            
            // Role distribution
            Map<String, Long> roleDistribution = resources.stream()
                    .collect(Collectors.groupingBy(ProjectResource::getRole, Collectors.counting()));
            
            projectData.put("roleDistribution", roleDistribution);
            
            projectStats.add(projectData);
        }
        
        // Sort by resource count in descending order
        projectStats.sort(Comparator.comparingInt(stats -> -((Integer) stats.get("resourceCount"))));
        
        result.put("projectStats", projectStats);
        result.put("totalProjects", projects.size());
        result.put("totalProjectsWithResources", projectStats.size());
        
        return result;
    }

    /**
     * Get user skill development analytics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getUserDevelopmentAnalytics(Long userId) {
        Map<String, Object> result = new HashMap<>();
        
        // Get user skills
        List<Skill> userSkills = skillRepository.findByUserId(userId);
        
        // Get skill history for the user
        List<SkillHistory> skillHistory = skillHistoryRepository.findByUserId(userId);
        
        // Get skill targets for the user
        List<SkillTarget> skillTargets = skillTargetRepository.findByUserId(userId);
        
        // Group skills by category
        Map<String, List<Skill>> skillsByCategory = userSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory));
        
        Map<String, Long> skillCountByCategory = skillsByCategory.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> (long) entry.getValue().size()));
        
        // Group skills by level
        Map<String, Long> skillCountByLevel = userSkills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        // Skill growth over time (last 12 months)
        LocalDateTime twelveMonthsAgo = LocalDateTime.now().minusMonths(12);
        
        Map<String, Long> skillCreationByMonth = userSkills.stream()
                .filter(skill -> skill.getCreatedAt().isAfter(twelveMonthsAgo))
                .collect(Collectors.groupingBy(
                        skill -> skill.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        
        // Skill level changes over time
        Map<String, List<SkillHistory>> levelChangesByMonth = skillHistory.stream()
                .filter(history -> "level".equals(history.getField()) && history.getCreatedAt().isAfter(twelveMonthsAgo))
                .collect(Collectors.groupingBy(
                        history -> history.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"))
                ));
        
        // Skill target statistics
        Map<String, Long> targetCountByStatus = skillTargets.stream()
                .collect(Collectors.groupingBy(SkillTarget::getStatus, Collectors.counting()));
        
        result.put("userId", userId);
        result.put("totalSkills", userSkills.size());
        result.put("skillsByCategory", skillCountByCategory);
        result.put("skillsByLevel", skillCountByLevel);
        result.put("skillCreationByMonth", skillCreationByMonth);
        result.put("skillLevelChangeCount", skillHistory.size());
        result.put("targetsByStatus", targetCountByStatus);
        
        return result;
    }

    /**
     * Get endorsement statistics
     */
    @Cacheable(value = "analyticsCache", key = "'endorsementStats'")
    @Transactional(readOnly = true)
    public Map<String, Object> getEndorsementStatistics() {
        Map<String, Object> result = new HashMap<>();
        
        List<Endorsement> endorsements = endorsementRepository.findAll();
        
        // Count total endorsements
        result.put("totalEndorsements", endorsements.size());
        
        // Get most endorsed skills
        Map<Long, Long> endorsementsBySkill = endorsements.stream()
                .collect(Collectors.groupingBy(Endorsement::getSkillId, Collectors.counting()));
        
        // Get top 10 most endorsed skills
        List<Map<String, Object>> topEndorsedSkills = new ArrayList<>();
        
        endorsementsBySkill.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    Long skillId = entry.getKey();
                    Long count = entry.getValue();
                    
                    Optional<Skill> skillOpt = skillRepository.findById(skillId);
                    if (skillOpt.isPresent()) {
                        Skill skill = skillOpt.get();
                        Map<String, Object> skillData = new HashMap<>();
                        skillData.put("skillId", skillId);
                        skillData.put("skillName", skill.getName());
                        skillData.put("category", skill.getCategory());
                        skillData.put("endorsementCount", count);
                        
                        topEndorsedSkills.add(skillData);
                    }
                });
        
        result.put("topEndorsedSkills", topEndorsedSkills);
        
        // Get most active endorsers
        Map<Long, Long> endorserCounts = endorsements.stream()
                .collect(Collectors.groupingBy(Endorsement::getEndorserId, Collectors.counting()));
        
        List<Map<String, Object>> topEndorsers = new ArrayList<>();
        
        endorserCounts.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(10)
                .forEach(entry -> {
                    Long userId = entry.getKey();
                    Long count = entry.getValue();
                    
                    Optional<User> userOpt = userRepository.findById(userId);
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("userId", userId);
                        userData.put("name", user.getFirstName() + " " + user.getLastName());
                        userData.put("endorsementCount", count);
                        
                        topEndorsers.add(userData);
                    }
                });
        
        result.put("topEndorsers", topEndorsers);
        
        return result;
    }

    /**
     * Get project completion statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectCompletionStats() {
        Map<String, Object> result = new HashMap<>();
        
        List<Project> projects = projectRepository.findAll();
        
        // Count by status
        Map<String, Long> projectsByStatus = projects.stream()
                .collect(Collectors.groupingBy(Project::getStatus, Collectors.counting()));
        
        result.put("projectsByStatus", projectsByStatus);
        
        // Calculate completion rate
        long totalProjects = projects.size();
        long completedProjects = projectsByStatus.getOrDefault("COMPLETED", 0L);
        double completionRate = totalProjects > 0 ? (completedProjects * 100.0) / totalProjects : 0;
        
        result.put("totalProjects", totalProjects);
        result.put("completedProjects", completedProjects);
        result.put("completionRate", completionRate);
        
        // Group by month
        Map<String, Long> projectsByMonth = projects.stream()
                .filter(project -> project.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        project -> project.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()
                ));
        
        result.put("projectsByMonth", projectsByMonth);
        
        return result;
    }

    /**
     * Get skill category comparison by project
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectSkillCategoryComparison(Long projectId) {
        Map<String, Object> result = new HashMap<>();
        
        // Get project
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            result.put("error", "Project not found");
            return result;
        }
        
        Project project = projectOpt.get();
        result.put("projectId", project.getId());
        result.put("projectName", project.getName());
        
        // Get project skills
        List<ProjectSkill> projectSkills = projectSkillRepository.findByProjectId(projectId);
        
        // Group by category
        Map<String, Long> projectSkillsByCategory = projectSkills.stream()
                .collect(Collectors.groupingBy(ProjectSkill::getCategory, Collectors.counting()));
        
        result.put("skillCategoryDistribution", projectSkillsByCategory);
        
        // Get project resources
        List<ProjectResource> resources = resourceRepository.findByProjectId(projectId);
        
        // Get user skills
        List<Long> userIds = resources.stream()
                .map(ProjectResource::getUserId)
                .collect(Collectors.toList());
        
        List<Skill> userSkills = new ArrayList<>();
        for (Long userId : userIds) {
            userSkills.addAll(skillRepository.findByUserId(userId));
        }
        
        // Group user skills by category
        Map<String, Long> userSkillsByCategory = userSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        result.put("resourceSkillCategoryDistribution", userSkillsByCategory);
        
        // Calculate skill match percentage by category
        Map<String, Object> categoryMatches = new HashMap<>();
        
        projectSkillsByCategory.forEach((category, requiredCount) -> {
            Long availableCount = userSkillsByCategory.getOrDefault(category, 0L);
            double matchPercentage = (availableCount * 100.0) / requiredCount;
            
            Map<String, Object> matchData = new HashMap<>();
            matchData.put("required", requiredCount);
            matchData.put("available", availableCount);
            matchData.put("matchPercentage", matchPercentage);
            
            categoryMatches.put(category, matchData);
        });
        
        result.put("categoryMatches", categoryMatches);
        
        return result;
    }
}