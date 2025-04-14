package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.*;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.criteria.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    @PersistenceContext
    private EntityManager entityManager;
    
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final ProjectResourceRepository resourceRepository;
    private final ClientRepository clientRepository;

    /**
     * Search for skills
     */
    @Transactional(readOnly = true)
    public List<SkillDto> searchSkills(String query, String category, String level, Long userId, int page, int size) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Skill> cq = cb.createQuery(Skill.class);
        Root<Skill> root = cq.from(Skill.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        // Search by query in name or description
        if (query != null && !query.isEmpty()) {
            String searchTerm = "%" + query.toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(root.get("name")), searchTerm);
            Predicate descriptionPredicate = cb.like(cb.lower(root.get("description")), searchTerm);
            predicates.add(cb.or(namePredicate, descriptionPredicate));
        }
        
        // Filter by category
        if (category != null && !category.isEmpty()) {
            predicates.add(cb.equal(root.get("category"), category));
        }
        
        // Filter by level
        if (level != null && !level.isEmpty()) {
            predicates.add(cb.equal(root.get("level"), level));
        }
        
        // Filter by user ID
        if (userId != null) {
            predicates.add(cb.equal(root.get("userId"), userId));
        }
        
        cq.where(predicates.toArray(new Predicate[0]));
        cq.orderBy(cb.asc(root.get("name")));
        
        List<Skill> skills = entityManager.createQuery(cq)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();
        
        // Convert to DTOs
        return skills.stream()
                .map(this::convertToSkillDto)
                .collect(Collectors.toList());
    }

    /**
     * Search for users
     */
    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String query, String role, String location, int page, int size) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> cq = cb.createQuery(User.class);
        Root<User> root = cq.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        // Search by query in name or email
        if (query != null && !query.isEmpty()) {
            String searchTerm = "%" + query.toLowerCase() + "%";
            Predicate emailPredicate = cb.like(cb.lower(root.get("email")), searchTerm);
            Predicate firstNamePredicate = cb.like(cb.lower(root.get("firstName")), searchTerm);
            Predicate lastNamePredicate = cb.like(cb.lower(root.get("lastName")), searchTerm);
            predicates.add(cb.or(emailPredicate, firstNamePredicate, lastNamePredicate));
        }
        
        // Filter by role
        if (role != null && !role.isEmpty()) {
            predicates.add(cb.equal(root.get("role"), role));
        }
        
        // Filter by location
        if (location != null && !location.isEmpty()) {
            predicates.add(cb.equal(root.get("location"), location));
        }
        
        cq.where(predicates.toArray(new Predicate[0]));
        cq.orderBy(cb.asc(root.get("lastName")), cb.asc(root.get("firstName")));
        
        List<User> users = entityManager.createQuery(cq)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();
        
        // Convert to DTOs
        return users.stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());
    }

    /**
     * Search for projects
     */
    @Transactional(readOnly = true)
    public List<ProjectDto> searchProjects(String query, String status, Long clientId, int page, int size) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Project> cq = cb.createQuery(Project.class);
        Root<Project> root = cq.from(Project.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        // Search by query in name or description
        if (query != null && !query.isEmpty()) {
            String searchTerm = "%" + query.toLowerCase() + "%";
            Predicate namePredicate = cb.like(cb.lower(root.get("name")), searchTerm);
            Predicate descriptionPredicate = cb.like(cb.lower(root.get("description")), searchTerm);
            predicates.add(cb.or(namePredicate, descriptionPredicate));
        }
        
        // Filter by status
        if (status != null && !status.isEmpty()) {
            predicates.add(cb.equal(root.get("status"), status));
        }
        
        // Filter by client ID
        if (clientId != null) {
            predicates.add(cb.equal(root.get("clientId"), clientId));
        }
        
        cq.where(predicates.toArray(new Predicate[0]));
        cq.orderBy(cb.desc(root.get("createdAt")));
        
        List<Project> projects = entityManager.createQuery(cq)
                .setFirstResult(page * size)
                .setMaxResults(size)
                .getResultList();
        
        // Convert to DTOs
        return projects.stream()
                .map(this::convertToProjectDto)
                .collect(Collectors.toList());
    }

    /**
     * Search for users by skill
     */
    @Transactional(readOnly = true)
    public List<UserDto> searchUsersBySkill(String skillName, String category, String level, int page, int size) {
        // Get users with the specified skill
        List<Skill> skills = skillRepository.findAll();
        
        List<Long> userIds = skills.stream()
                .filter(skill -> {
                    boolean nameMatch = skill.getName().toLowerCase().contains(skillName.toLowerCase());
                    boolean categoryMatch = category == null || category.isEmpty() || skill.getCategory().equals(category);
                    boolean levelMatch = level == null || level.isEmpty() || skill.getLevel().equals(level);
                    return nameMatch && categoryMatch && levelMatch;
                })
                .map(Skill::getUserId)
                .distinct()
                .collect(Collectors.toList());
        
        if (userIds.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Limit to page size
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, userIds.size());
        
        if (fromIndex >= userIds.size()) {
            return Collections.emptyList();
        }
        
        List<Long> pagedUserIds = userIds.subList(fromIndex, toIndex);
        
        // Get users
        List<User> users = userRepository.findAllById(pagedUserIds);
        
        // Sort by name
        users.sort(Comparator.comparing(User::getLastName).thenComparing(User::getFirstName));
        
        // Convert to DTOs
        return users.stream()
                .map(this::convertToUserDto)
                .collect(Collectors.toList());
    }

    /**
     * Find skill gaps for a project
     */
    @Transactional(readOnly = true)
    public Map<String, Object> findProjectSkillGaps(Long projectId) {
        Map<String, Object> result = new HashMap<>();
        
        // Get project
        Optional<Project> projectOpt = projectRepository.findById(projectId);
        if (!projectOpt.isPresent()) {
            return Map.of("error", "Project not found");
        }
        
        Project project = projectOpt.get();
        result.put("projectId", project.getId());
        result.put("projectName", project.getName());
        
        // Get project skills
        List<ProjectSkill> projectSkills = projectSkillRepository.findByProjectId(projectId);
        if (projectSkills.isEmpty()) {
            return Map.of(
                "projectId", project.getId(),
                "projectName", project.getName(),
                "requiredSkills", Collections.emptyList(),
                "gaps", Collections.emptyList()
            );
        }
        
        // Get project resources
        List<ProjectResource> resources = resourceRepository.findByProjectId(projectId);
        List<Long> resourceUserIds = resources.stream()
                .map(ProjectResource::getUserId)
                .collect(Collectors.toList());
        
        // Get skills of all resources
        List<Skill> resourceSkills = new ArrayList<>();
        for (Long userId : resourceUserIds) {
            resourceSkills.addAll(skillRepository.findByUserId(userId));
        }
        
        // Group skills by name and category for exact matching
        Map<String, List<Skill>> skillMap = resourceSkills.stream()
                .collect(Collectors.groupingBy(skill -> skill.getName() + "|" + skill.getCategory()));
        
        // Find gaps
        List<Map<String, Object>> gaps = new ArrayList<>();
        
        for (ProjectSkill projectSkill : projectSkills) {
            String key = projectSkill.getSkillName() + "|" + projectSkill.getCategory();
            List<Skill> matchingSkills = skillMap.getOrDefault(key, Collections.emptyList());
            
            // Check if skill exists but at lower level
            boolean hasSkillsWithLowerLevel = matchingSkills.stream()
                    .anyMatch(skill -> compareSkillLevels(skill.getLevel(), projectSkill.getRequiredLevel()) < 0);
            
            // Add to gaps if skill doesn't exist or only exists at lower level
            if (matchingSkills.isEmpty() || (hasSkillsWithLowerLevel && 
                    matchingSkills.stream().noneMatch(skill -> 
                            compareSkillLevels(skill.getLevel(), projectSkill.getRequiredLevel()) >= 0))) {
                
                Map<String, Object> gap = new HashMap<>();
                gap.put("skillName", projectSkill.getSkillName());
                gap.put("category", projectSkill.getCategory());
                gap.put("requiredLevel", projectSkill.getRequiredLevel());
                
                if (hasSkillsWithLowerLevel) {
                    gap.put("gapType", "UPGRADE_NEEDED");
                    gap.put("currentLevel", matchingSkills.get(0).getLevel());
                } else {
                    gap.put("gapType", "MISSING");
                    gap.put("currentLevel", null);
                }
                
                gaps.add(gap);
            }
        }
        
        result.put("requiredSkills", projectSkills);
        result.put("gaps", gaps);
        
        return result;
    }

    /**
     * Find users with skills matching project requirements
     */
    @Transactional(readOnly = true)
    public List<UserDto> findUsersMatchingProjectSkills(Long projectId, int page, int size) {
        // Get project skills
        List<ProjectSkill> projectSkills = projectSkillRepository.findByProjectId(projectId);
        
        if (projectSkills.isEmpty()) {
            return Collections.emptyList();
        }
        
        // Create a map of project skill requirements
        Map<String, String> requiredSkills = projectSkills.stream()
                .collect(Collectors.toMap(
                        ps -> ps.getSkillName() + "|" + ps.getCategory(),
                        ProjectSkill::getRequiredLevel
                ));
        
        // Get all users
        List<User> allUsers = userRepository.findAll();
        
        // Calculate match score for each user
        List<Map.Entry<User, Double>> userMatches = new ArrayList<>();
        
        for (User user : allUsers) {
            List<Skill> userSkills = skillRepository.findByUserId(user.getId());
            
            if (userSkills.isEmpty()) {
                continue;
            }
            
            // Create a map of user skills
            Map<String, String> userSkillsMap = userSkills.stream()
                    .collect(Collectors.toMap(
                            skill -> skill.getName() + "|" + skill.getCategory(),
                            Skill::getLevel,
                            (s1, s2) -> compareSkillLevels(s1, s2) > 0 ? s1 : s2 // Keep the higher level
                    ));
            
            // Calculate match score
            double matchScore = 0.0;
            int totalSkills = requiredSkills.size();
            
            for (Map.Entry<String, String> requiredSkill : requiredSkills.entrySet()) {
                String key = requiredSkill.getKey();
                String requiredLevel = requiredSkill.getValue();
                
                if (userSkillsMap.containsKey(key)) {
                    String userLevel = userSkillsMap.get(key);
                    int levelCompare = compareSkillLevels(userLevel, requiredLevel);
                    
                    if (levelCompare >= 0) {
                        // User meets or exceeds the required level
                        matchScore += 1.0;
                    } else {
                        // User has the skill but at a lower level
                        matchScore += 0.5;
                    }
                }
            }
            
            // Calculate percentage match
            double percentageMatch = (matchScore / totalSkills) * 100;
            
            if (percentageMatch > 0) {
                userMatches.add(Map.entry(user, percentageMatch));
            }
        }
        
        // Sort by match percentage in descending order
        userMatches.sort(Map.Entry.<User, Double>comparingByValue().reversed());
        
        // Paginate results
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, userMatches.size());
        
        if (fromIndex >= userMatches.size()) {
            return Collections.emptyList();
        }
        
        List<Map.Entry<User, Double>> pagedUserMatches = userMatches.subList(fromIndex, toIndex);
        
        // Convert to DTOs with match percentage
        return pagedUserMatches.stream()
                .map(entry -> {
                    UserDto dto = convertToUserDto(entry.getKey());
                    dto.setMatchPercentage(entry.getValue());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Search for all entities (skills, users, projects)
     */
    @Transactional(readOnly = true)
    public Map<String, Object> searchAllEntities(String query, int limit) {
        Map<String, Object> result = new HashMap<>();
        
        if (query == null || query.isEmpty()) {
            result.put("skills", Collections.emptyList());
            result.put("users", Collections.emptyList());
            result.put("projects", Collections.emptyList());
            return result;
        }
        
        // Search skills
        List<SkillDto> skills = searchSkills(query, null, null, null, 0, limit);
        result.put("skills", skills);
        
        // Search users
        List<UserDto> users = searchUsers(query, null, null, 0, limit);
        result.put("users", users);
        
        // Search projects
        List<ProjectDto> projects = searchProjects(query, null, null, 0, limit);
        result.put("projects", projects);
        
        return result;
    }

    /**
     * Autocomplete search
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> autocompleteSearch(String query, String type, int limit) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        if (query == null || query.isEmpty()) {
            return results;
        }
        
        String searchTerm = query.toLowerCase() + "%";
        
        // Search by type
        if (type == null || type.isEmpty() || "skill".equalsIgnoreCase(type)) {
            // Search skill names
            List<Skill> skills = skillRepository.findAll().stream()
                    .filter(skill -> skill.getName().toLowerCase().startsWith(query.toLowerCase()))
                    .limit(limit)
                    .collect(Collectors.toList());
            
            for (Skill skill : skills) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", skill.getId());
                result.put("text", skill.getName());
                result.put("category", skill.getCategory());
                result.put("type", "skill");
                results.add(result);
            }
        }
        
        if (type == null || type.isEmpty() || "user".equalsIgnoreCase(type)) {
            // Search user names
            List<User> users = userRepository.findAll().stream()
                    .filter(user -> {
                        String fullName = (user.getFirstName() + " " + user.getLastName()).toLowerCase();
                        return fullName.contains(query.toLowerCase()) || 
                               user.getEmail().toLowerCase().contains(query.toLowerCase());
                    })
                    .limit(limit)
                    .collect(Collectors.toList());
            
            for (User user : users) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", user.getId());
                result.put("text", user.getFirstName() + " " + user.getLastName());
                result.put("email", user.getEmail());
                result.put("type", "user");
                results.add(result);
            }
        }
        
        if (type == null || type.isEmpty() || "project".equalsIgnoreCase(type)) {
            // Search project names
            List<Project> projects = projectRepository.findAll().stream()
                    .filter(project -> project.getName().toLowerCase().contains(query.toLowerCase()))
                    .limit(limit)
                    .collect(Collectors.toList());
            
            for (Project project : projects) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", project.getId());
                result.put("text", project.getName());
                result.put("status", project.getStatus());
                result.put("type", "project");
                results.add(result);
            }
        }
        
        // Sort by relevance and limit
        results.sort((r1, r2) -> {
            String text1 = ((String) r1.get("text")).toLowerCase();
            String text2 = ((String) r2.get("text")).toLowerCase();
            
            // Items that start with the query term rank higher
            boolean starts1 = text1.startsWith(query.toLowerCase());
            boolean starts2 = text2.startsWith(query.toLowerCase());
            
            if (starts1 && !starts2) return -1;
            if (!starts1 && starts2) return 1;
            
            // Otherwise, sort alphabetically
            return text1.compareTo(text2);
        });
        
        if (results.size() > limit) {
            results = results.subList(0, limit);
        }
        
        return results;
    }

    /**
     * Advanced search
     */
    @Transactional(readOnly = true)
    public Map<String, Object> advancedSearch(Map<String, Object> searchCriteria, int page, int size) {
        Map<String, Object> result = new HashMap<>();
        
        String entityType = (String) searchCriteria.get("entityType");
        
        if ("skill".equalsIgnoreCase(entityType)) {
            String query = (String) searchCriteria.get("query");
            String category = (String) searchCriteria.get("category");
            String level = (String) searchCriteria.get("level");
            Long userId = null;
            
            if (searchCriteria.containsKey("userId")) {
                userId = Long.valueOf(searchCriteria.get("userId").toString());
            }
            
            List<SkillDto> skills = searchSkills(query, category, level, userId, page, size);
            result.put("skills", skills);
            result.put("totalCount", skills.size()); // This is not accurate for paging, but simplifies the implementation
            
        } else if ("user".equalsIgnoreCase(entityType)) {
            String query = (String) searchCriteria.get("query");
            String role = (String) searchCriteria.get("role");
            String location = (String) searchCriteria.get("location");
            
            List<UserDto> users = searchUsers(query, role, location, page, size);
            result.put("users", users);
            result.put("totalCount", users.size()); // This is not accurate for paging, but simplifies the implementation
            
        } else if ("project".equalsIgnoreCase(entityType)) {
            String query = (String) searchCriteria.get("query");
            String status = (String) searchCriteria.get("status");
            Long clientId = null;
            
            if (searchCriteria.containsKey("clientId")) {
                clientId = Long.valueOf(searchCriteria.get("clientId").toString());
            }
            
            List<ProjectDto> projects = searchProjects(query, status, clientId, page, size);
            result.put("projects", projects);
            result.put("totalCount", projects.size()); // This is not accurate for paging, but simplifies the implementation
            
        } else {
            result.put("error", "Invalid entity type: " + entityType);
        }
        
        return result;
    }

    // Helper methods

    private SkillDto convertToSkillDto(Skill skill) {
        SkillDto dto = new SkillDto();
        dto.setId(skill.getId());
        dto.setUserId(skill.getUserId());
        dto.setName(skill.getName());
        dto.setCategory(skill.getCategory());
        dto.setLevel(skill.getLevel());
        dto.setDescription(skill.getDescription());
        dto.setCertification(skill.getCertification());
        dto.setCredlyLink(skill.getCredlyLink());
        dto.setCreatedAt(skill.getCreatedAt());
        dto.setUpdatedAt(skill.getUpdatedAt());
        
        // Get user name
        userRepository.findById(skill.getUserId()).ifPresent(user -> {
            dto.setUserName(user.getFirstName() + " " + user.getLastName());
        });
        
        return dto;
    }

    private UserDto convertToUserDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setRole(user.getRole());
        dto.setLocation(user.getLocation());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        
        // Get user skills
        List<Skill> skills = skillRepository.findByUserId(user.getId());
        dto.setSkillCount(skills.size());
        
        return dto;
    }

    private ProjectDto convertToProjectDto(Project project) {
        ProjectDto dto = new ProjectDto();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setClientId(project.getClientId());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setLocation(project.getLocation());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        
        // Get client name
        if (project.getClientId() != null) {
            clientRepository.findById(project.getClientId()).ifPresent(client -> {
                dto.setClientName(client.getName());
            });
        }
        
        // Get resource count
        List<ProjectResource> resources = resourceRepository.findByProjectId(project.getId());
        dto.setResourceCount(resources.size());
        
        return dto;
    }

    private int compareSkillLevels(String level1, String level2) {
        Map<String, Integer> levelValues = Map.of(
            "BEGINNER", 1,
            "INTERMEDIATE", 2,
            "ADVANCED", 3,
            "EXPERT", 4
        );
        
        Integer value1 = levelValues.getOrDefault(level1.toUpperCase(), 0);
        Integer value2 = levelValues.getOrDefault(level2.toUpperCase(), 0);
        
        return value1.compareTo(value2);
    }
}