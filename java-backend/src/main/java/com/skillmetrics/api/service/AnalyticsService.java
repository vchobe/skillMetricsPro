package com.skillmetrics.api.service;

import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.model.enums.SkillLevel;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final EndorsementRepository endorsementRepository;
    private final SkillHistoryRepository skillHistoryRepository;
    private final ProjectResourceRepository projectResourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ProfileHistoryRepository profileHistoryRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // User statistics
        stats.put("totalUsers", userRepository.count());
        stats.put("adminCount", userRepository.countUsersByRole("ROLE_ADMIN"));
        stats.put("managerCount", userRepository.countUsersByRole("ROLE_MANAGER"));
        stats.put("userCount", userRepository.countUsersByRole("ROLE_USER"));
        
        // Skill statistics
        stats.put("totalSkills", skillRepository.count());
        stats.put("verifiedSkillsCount", skillRepository.findAllVerifiedSkills().size());
        stats.put("skillCategoriesCount", skillRepository.findAllCategories().size());
        
        // Project statistics
        stats.put("totalProjects", projectRepository.count());
        stats.put("activeProjectsCount", projectRepository.countByStatus("ACTIVE"));
        stats.put("completedProjectsCount", projectRepository.countByStatus("COMPLETED"));
        
        // Endorsement statistics
        stats.put("totalEndorsements", endorsementRepository.count());
        
        return stats;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Integer> getSkillDistributionByLevel() {
        Map<String, Integer> distribution = new HashMap<>();
        
        distribution.put("BEGINNER", getSkillCountByLevel(SkillLevel.BEGINNER));
        distribution.put("INTERMEDIATE", getSkillCountByLevel(SkillLevel.INTERMEDIATE));
        distribution.put("ADVANCED", getSkillCountByLevel(SkillLevel.ADVANCED));
        distribution.put("EXPERT", getSkillCountByLevel(SkillLevel.EXPERT));
        
        return distribution;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Integer> getSkillDistributionByCategory() {
        Map<String, Integer> distribution = new HashMap<>();
        
        List<String> categories = skillRepository.findAllCategories();
        for (String category : categories) {
            int count = skillRepository.findByCategoryContainingIgnoreCase(category).size();
            distribution.put(category, count);
        }
        
        return distribution;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Integer> getProjectDistributionByStatus() {
        Map<String, Integer> distribution = new HashMap<>();
        
        List<String> statuses = projectRepository.findAllStatuses();
        for (String status : statuses) {
            int count = projectRepository.countByStatus(status);
            distribution.put(status, count);
        }
        
        return distribution;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Double> getAverageSkillsPerUser() {
        Map<String, Double> averages = new HashMap<>();
        
        long totalUsers = userRepository.count();
        if (totalUsers > 0) {
            double avgTotal = (double) skillRepository.count() / totalUsers;
            averages.put("TOTAL", avgTotal);
            
            double avgBeginner = (double) getSkillCountByLevel(SkillLevel.BEGINNER) / totalUsers;
            averages.put("BEGINNER", avgBeginner);
            
            double avgIntermediate = (double) getSkillCountByLevel(SkillLevel.INTERMEDIATE) / totalUsers;
            averages.put("INTERMEDIATE", avgIntermediate);
            
            double avgAdvanced = (double) getSkillCountByLevel(SkillLevel.ADVANCED) / totalUsers;
            averages.put("ADVANCED", avgAdvanced);
            
            double avgExpert = (double) getSkillCountByLevel(SkillLevel.EXPERT) / totalUsers;
            averages.put("EXPERT", avgExpert);
        }
        
        return averages;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Integer> getTopSkillCategories(int limit) {
        Map<String, Integer> topCategories = new HashMap<>();
        
        List<String> categories = skillRepository.findAllCategories();
        
        // Sort categories by skill count
        categories.sort((c1, c2) -> {
            int count1 = skillRepository.findByCategoryContainingIgnoreCase(c1).size();
            int count2 = skillRepository.findByCategoryContainingIgnoreCase(c2).size();
            return Integer.compare(count2, count1); // Descending order
        });
        
        // Take the top 'limit' categories
        categories.stream()
                .limit(limit)
                .forEach(category -> {
                    int count = skillRepository.findByCategoryContainingIgnoreCase(category).size();
                    topCategories.put(category, count);
                });
        
        return topCategories;
    }
    
    // Advanced analytics methods
    
    @Transactional(readOnly = true)
    public Map<String, Object> getAdvancedAnalytics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> advancedStats = new HashMap<>();
        
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusYears(1).atStartOfDay();
        LocalDateTime endDateTime = endDate != null ? endDate.atStartOfDay().plusDays(1) : LocalDateTime.now();
        
        // Get skill growth over time
        advancedStats.put("skillGrowth", getSkillGrowthTrend(startDate, endDate));
        
        // Get endorsement statistics
        advancedStats.put("endorsementTrend", getEndorsementsTrend());
        
        // Get skill distribution by project demand
        advancedStats.put("projectSkillDemand", getProjectSkillDemand());
        
        // Get certification statistics
        advancedStats.put("certificationStats", getCertificationReport());
        
        // Get skill level progression statistics
        advancedStats.put("skillLevelProgressions", getSkillLevelProgressions(startDateTime, endDateTime));
        
        // Get user activity metrics
        advancedStats.put("userActivityMetrics", getUserActivityMetrics(startDateTime, endDateTime));
        
        // Get skill category growth rates
        advancedStats.put("categoryGrowthRates", getCategoryGrowthRates(startDateTime, endDateTime));
        
        return advancedStats;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getCertificationReport() {
        Map<String, Object> report = new HashMap<>();
        
        // Get all skills with certifications
        List<Skill> certifiedSkills = skillRepository.findAllCertifiedSkills();
        
        // Total certifications
        report.put("totalCertifications", certifiedSkills.size());
        
        // Certifications by category
        Map<String, Long> certsByCategory = certifiedSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        report.put("certificationsByCategory", certsByCategory);
        
        // Certifications by level
        Map<SkillLevel, Long> certsByLevel = certifiedSkills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        Map<String, Long> certsByLevelString = new HashMap<>();
        certsByLevel.forEach((key, value) -> certsByLevelString.put(key.toString(), value));
        report.put("certificationsByLevel", certsByLevelString);
        
        // Expiring certifications (within next 90 days)
        LocalDateTime ninetyDaysFromNow = LocalDateTime.now().plusDays(90);
        List<Skill> expiringCerts = certifiedSkills.stream()
                .filter(skill -> skill.getExpirationDate() != null && 
                        skill.getExpirationDate().isBefore(ninetyDaysFromNow) &&
                        skill.getExpirationDate().isAfter(LocalDateTime.now()))
                .collect(Collectors.toList());
        
        report.put("expiringCertificationsCount", expiringCerts.size());
        
        // Format expiring certifications for display
        List<Map<String, Object>> expiringCertDetails = expiringCerts.stream()
                .map(skill -> {
                    Map<String, Object> details = new HashMap<>();
                    details.put("skillId", skill.getId());
                    details.put("skillName", skill.getName());
                    details.put("userId", skill.getUser().getId());
                    details.put("userName", skill.getUser().getFirstName() + " " + skill.getUser().getLastName());
                    details.put("expirationDate", skill.getExpirationDate().format(DateTimeFormatter.ISO_DATE));
                    return details;
                })
                .collect(Collectors.toList());
        
        report.put("expiringCertifications", expiringCertDetails);
        
        // Top certification types
        Map<String, Long> certTypes = certifiedSkills.stream()
                .filter(skill -> skill.getCertification() != null && !skill.getCertification().isEmpty())
                .collect(Collectors.groupingBy(Skill::getCertification, Collectors.counting()));
        
        report.put("topCertificationTypes", 
                certTypes.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(10)
                        .collect(Collectors.toMap(
                                Map.Entry::getKey,
                                Map.Entry::getValue,
                                (e1, e2) -> e1,
                                LinkedHashMap::new)));
        
        return report;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillHistoryAnalytics(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> historyAnalytics = new HashMap<>();
        
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusYears(1).atStartOfDay();
        LocalDateTime endDateTime = endDate != null ? endDate.atStartOfDay().plusDays(1) : LocalDateTime.now();
        
        // Get skill history within date range
        var skillHistories = skillHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
        
        historyAnalytics.put("totalHistoryRecords", skillHistories.size());
        
        // Count level progressions
        Map<String, Integer> levelProgressions = new HashMap<>();
        levelProgressions.put("BEGINNER_TO_INTERMEDIATE", 0);
        levelProgressions.put("INTERMEDIATE_TO_ADVANCED", 0);
        levelProgressions.put("ADVANCED_TO_EXPERT", 0);
        
        skillHistories.forEach(history -> {
            if (history.getPreviousLevel() != null) {
                if (history.getPreviousLevel() == SkillLevel.BEGINNER && history.getNewLevel() == SkillLevel.INTERMEDIATE) {
                    levelProgressions.put("BEGINNER_TO_INTERMEDIATE", levelProgressions.get("BEGINNER_TO_INTERMEDIATE") + 1);
                } else if (history.getPreviousLevel() == SkillLevel.INTERMEDIATE && history.getNewLevel() == SkillLevel.ADVANCED) {
                    levelProgressions.put("INTERMEDIATE_TO_ADVANCED", levelProgressions.get("INTERMEDIATE_TO_ADVANCED") + 1);
                } else if (history.getPreviousLevel() == SkillLevel.ADVANCED && history.getNewLevel() == SkillLevel.EXPERT) {
                    levelProgressions.put("ADVANCED_TO_EXPERT", levelProgressions.get("ADVANCED_TO_EXPERT") + 1);
                }
            }
        });
        
        historyAnalytics.put("levelProgressions", levelProgressions);
        
        // Group skill history by month
        Map<String, Long> historyByMonth = skillHistories.stream()
                .collect(Collectors.groupingBy(
                        history -> history.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));
        
        historyAnalytics.put("historyByMonth", historyByMonth);
        
        return historyAnalytics;
    }
    
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserProgressAnalytics() {
        List<Map<String, Object>> userProgress = new ArrayList<>();
        
        // Get all users and their skills
        var users = userRepository.findAll();
        
        for (var user : users) {
            Map<String, Object> userStats = new HashMap<>();
            userStats.put("userId", user.getId());
            userStats.put("userName", user.getFirstName() + " " + user.getLastName());
            
            // Get user's skills
            var skills = skillRepository.findByUserId(user.getId());
            
            // Count skills by level
            Map<SkillLevel, Long> skillsByLevel = skills.stream()
                    .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
            
            Map<String, Long> skillsByLevelString = new HashMap<>();
            skillsByLevel.forEach((key, value) -> skillsByLevelString.put(key.toString(), value));
            
            userStats.put("skillsByLevel", skillsByLevelString);
            
            // Get skill history for progress tracking
            var skillHistory = skillHistoryRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
            userStats.put("skillHistoryCount", skillHistory.size());
            
            // Count level progressions for this user
            long progressions = skillHistory.stream()
                    .filter(history -> history.getPreviousLevel() != null && 
                            history.getNewLevel().compareTo(history.getPreviousLevel()) > 0)
                    .count();
            
            userStats.put("levelProgressions", progressions);
            
            // Calculate progression rate (progressions per skill)
            double progressionRate = skills.isEmpty() ? 0 : (double) progressions / skills.size();
            userStats.put("progressionRate", progressionRate);
            
            userProgress.add(userStats);
        }
        
        // Sort by progression rate (highest first)
        userProgress.sort((u1, u2) -> 
                Double.compare((Double) u2.get("progressionRate"), (Double) u1.get("progressionRate")));
        
        return userProgress;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getSkillGrowthTrend(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> growthTrend = new HashMap<>();
        
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusYears(1).atStartOfDay();
        LocalDateTime endDateTime = endDate != null ? endDate.atStartOfDay().plusDays(1) : LocalDateTime.now();
        
        // Get all skills created within the date range
        var skills = skillRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        
        // Group skills by month of creation
        Map<String, Long> skillsByMonth = skills.stream()
                .collect(Collectors.groupingBy(
                        skill -> skill.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));
        
        growthTrend.put("skillCreationByMonth", skillsByMonth);
        
        // Group skills by category
        Map<String, Long> skillsByCategory = skills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        growthTrend.put("skillsByCategory", skillsByCategory);
        
        // Group skills by level
        Map<SkillLevel, Long> skillsByLevel = skills.stream()
                .collect(Collectors.groupingBy(Skill::getLevel, Collectors.counting()));
        
        Map<String, Long> skillsByLevelString = new HashMap<>();
        skillsByLevel.forEach((key, value) -> skillsByLevelString.put(key.toString(), value));
        
        growthTrend.put("skillsByLevel", skillsByLevelString);
        
        return growthTrend;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getEndorsementsTrend() {
        Map<String, Object> endorsementTrend = new HashMap<>();
        
        // Get all endorsements
        var endorsements = endorsementRepository.findAll();
        
        endorsementTrend.put("totalEndorsements", endorsements.size());
        
        // Group endorsements by month
        Map<String, Long> endorsementsByMonth = endorsements.stream()
                .collect(Collectors.groupingBy(
                        endorsement -> endorsement.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));
        
        endorsementTrend.put("endorsementsByMonth", endorsementsByMonth);
        
        // Get top endorsed skill categories
        Map<String, Long> topEndorsedCategories = new HashMap<>();
        
        endorsements.forEach(endorsement -> {
            var skill = endorsement.getSkill();
            String category = skill.getCategory();
            
            topEndorsedCategories.put(category, topEndorsedCategories.getOrDefault(category, 0L) + 1);
        });
        
        // Sort and limit to top 10
        Map<String, Long> top10Categories = topEndorsedCategories.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
        
        endorsementTrend.put("topEndorsedCategories", top10Categories);
        
        return endorsementTrend;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectSkillDemand() {
        Map<String, Object> skillDemand = new HashMap<>();
        
        // Get all project skills
        var projectSkills = projectSkillRepository.findAll();
        
        // Group by skill category
        Map<String, Long> demandByCategory = new HashMap<>();
        
        projectSkills.forEach(projectSkill -> {
            var skill = projectSkill.getSkill();
            String category = skill.getCategory();
            
            demandByCategory.put(category, demandByCategory.getOrDefault(category, 0L) + 1);
        });
        
        skillDemand.put("demandByCategory", demandByCategory);
        
        // Group by required level
        Map<SkillLevel, Long> demandByLevel = projectSkills.stream()
                .collect(Collectors.groupingBy(ps -> ps.getRequiredLevel(), Collectors.counting()));
        
        Map<String, Long> demandByLevelString = new HashMap<>();
        demandByLevel.forEach((key, value) -> demandByLevelString.put(key.toString(), value));
        
        skillDemand.put("demandByLevel", demandByLevelString);
        
        // Calculate most in-demand specific skills
        Map<String, Long> demandBySkillName = new HashMap<>();
        
        projectSkills.forEach(projectSkill -> {
            var skill = projectSkill.getSkill();
            String skillName = skill.getName();
            
            demandBySkillName.put(skillName, demandBySkillName.getOrDefault(skillName, 0L) + 1);
        });
        
        // Sort and limit to top 20
        Map<String, Long> top20Skills = demandBySkillName.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(20)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
        
        skillDemand.put("topInDemandSkills", top20Skills);
        
        return skillDemand;
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getOrganizationSkillHistory(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> orgHistory = new HashMap<>();
        
        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusYears(1).atStartOfDay();
        LocalDateTime endDateTime = endDate != null ? endDate.atStartOfDay().plusDays(1) : LocalDateTime.now();
        
        // Get all skill history records in the date range
        var skillHistories = skillHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
        
        // Organization-wide skill level changes
        Map<String, Integer> levelChanges = new HashMap<>();
        skillHistories.forEach(history -> {
            if (history.getPreviousLevel() != null) {
                String changeKey = history.getPreviousLevel() + "_TO_" + history.getNewLevel();
                levelChanges.put(changeKey, levelChanges.getOrDefault(changeKey, 0) + 1);
            }
        });
        
        orgHistory.put("skillLevelChanges", levelChanges);
        
        // Monthly skill progression trends
        Map<String, Map<String, Integer>> monthlyProgressions = new HashMap<>();
        
        skillHistories.forEach(history -> {
            String month = history.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            
            if (!monthlyProgressions.containsKey(month)) {
                monthlyProgressions.put(month, new HashMap<>());
            }
            
            if (history.getPreviousLevel() != null) {
                String changeKey = history.getPreviousLevel() + "_TO_" + history.getNewLevel();
                Map<String, Integer> monthChanges = monthlyProgressions.get(month);
                monthChanges.put(changeKey, monthChanges.getOrDefault(changeKey, 0) + 1);
            }
        });
        
        orgHistory.put("monthlyProgressions", monthlyProgressions);
        
        return orgHistory;
    }
    
    // Additional helper methods for advanced analytics
    
    private Map<String, Object> getSkillLevelProgressions(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        Map<String, Object> progressions = new HashMap<>();
        
        // Get all skill histories in date range
        var histories = skillHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
        
        // Filter to only progression histories (level improvements)
        var levelProgressions = histories.stream()
                .filter(h -> h.getPreviousLevel() != null && h.getNewLevel().compareTo(h.getPreviousLevel()) > 0)
                .collect(Collectors.toList());
        
        progressions.put("totalProgressions", levelProgressions.size());
        
        // Group progressions by user
        Map<Long, Integer> progressionsByUser = new HashMap<>();
        
        levelProgressions.forEach(history -> {
            Long userId = history.getUser().getId();
            progressionsByUser.put(userId, progressionsByUser.getOrDefault(userId, 0) + 1);
        });
        
        // Find users with most progressions
        List<Map<String, Object>> topProgressingUsers = progressionsByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    var user = userRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> userProgression = new HashMap<>();
                    userProgression.put("userId", entry.getKey());
                    userProgression.put("userName", user != null ? user.getFirstName() + " " + user.getLastName() : "Unknown");
                    userProgression.put("progressionCount", entry.getValue());
                    return userProgression;
                })
                .collect(Collectors.toList());
        
        progressions.put("topProgressingUsers", topProgressingUsers);
        
        return progressions;
    }
    
    private Map<String, Object> getUserActivityMetrics(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        Map<String, Object> activityMetrics = new HashMap<>();
        
        // Get all profile and skill history in date range
        var profileHistories = profileHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
        var skillHistories = skillHistoryRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(startDateTime, endDateTime);
        
        // Combine to get overall user activity
        Map<Long, Integer> activityByUser = new HashMap<>();
        
        profileHistories.forEach(history -> {
            Long userId = history.getUser().getId();
            activityByUser.put(userId, activityByUser.getOrDefault(userId, 0) + 1);
        });
        
        skillHistories.forEach(history -> {
            Long userId = history.getUser().getId();
            activityByUser.put(userId, activityByUser.getOrDefault(userId, 0) + 1);
        });
        
        // Find most active users
        List<Map<String, Object>> mostActiveUsers = activityByUser.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    var user = userRepository.findById(entry.getKey()).orElse(null);
                    Map<String, Object> userActivity = new HashMap<>();
                    userActivity.put("userId", entry.getKey());
                    userActivity.put("userName", user != null ? user.getFirstName() + " " + user.getLastName() : "Unknown");
                    userActivity.put("activityCount", entry.getValue());
                    return userActivity;
                })
                .collect(Collectors.toList());
        
        activityMetrics.put("mostActiveUsers", mostActiveUsers);
        
        return activityMetrics;
    }
    
    private Map<String, Object> getCategoryGrowthRates(LocalDateTime startDateTime, LocalDateTime endDateTime) {
        Map<String, Object> growthRates = new HashMap<>();
        
        // Get historical skill counts by category (at start date)
        var historicalSkills = skillRepository.findByCreatedAtBefore(startDateTime);
        Map<String, Long> historicalCounts = historicalSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        // Get new skills by category (during period)
        var newSkills = skillRepository.findByCreatedAtBetween(startDateTime, endDateTime);
        Map<String, Long> newCounts = newSkills.stream()
                .collect(Collectors.groupingBy(Skill::getCategory, Collectors.counting()));
        
        // Calculate growth rates
        Map<String, Double> growthRateByCategory = new HashMap<>();
        
        for (var category : newCounts.keySet()) {
            long historicalCount = historicalCounts.getOrDefault(category, 0L);
            long newCount = newCounts.get(category);
            
            double growthRate = historicalCount == 0 ? 100.0 : (newCount / (double) historicalCount) * 100.0;
            growthRateByCategory.put(category, growthRate);
        }
        
        // Sort by growth rate (highest first)
        Map<String, Double> sortedGrowthRates = growthRateByCategory.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));
        
        growthRates.put("categoryGrowthRates", sortedGrowthRates);
        
        return growthRates;
    }
    
    // Original helper methods
    
    private int getSkillCountByLevel(SkillLevel level) {
        return skillRepository.findByLevel(level).size();
    }
}
