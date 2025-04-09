package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.dto.SkillDto;
import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.model.enums.SkillLevel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final UserService userService;
    private final SkillService skillService;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public Map<String, Object> searchAll(String term) {
        Map<String, Object> results = new HashMap<>();
        
        results.put("users", userService.searchUsers(term));
        results.put("skills", skillService.searchSkills(term));
        results.put("projects", projectService.searchProjects(term));
        
        return results;
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> findUsersBySkill(String skillName) {
        List<SkillDto> skills = skillService.searchSkills(skillName);
        
        if (skills.isEmpty()) {
            return Collections.emptyList();
        }
        
        return skills.stream()
                .map(skill -> userService.getUserById(skill.getUserId()))
                .distinct()
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> findUsersBySkillAndLevel(String skillName, SkillLevel level) {
        List<SkillDto> skills = skillService.searchSkills(skillName);
        
        if (skills.isEmpty()) {
            return Collections.emptyList();
        }
        
        return skills.stream()
                .filter(skill -> skill.getLevel() == level)
                .map(skill -> userService.getUserById(skill.getUserId()))
                .distinct()
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> findProjectsBySkill(String skillName) {
        // Find all projects that require this skill
        return projectService.getAllProjects().stream()
                .filter(project -> 
                    projectService.getSkillsForProject(project.getId()).stream()
                        .anyMatch(projectSkill -> 
                            projectSkill.getSkillName().toLowerCase().contains(skillName.toLowerCase())
                        )
                )
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<SkillDto> findMatchingSkillsForProject(Long projectId) {
        ProjectDto project = projectService.getProjectById(projectId);
        List<SkillDto> allSkills = skillService.getAllSkills();
        
        // Get the required skills for the project
        List<String> requiredSkillNames = projectService.getSkillsForProject(projectId).stream()
                .map(projectSkill -> projectSkill.getSkillName().toLowerCase())
                .collect(Collectors.toList());
        
        // Filter skills that match the project requirements
        return allSkills.stream()
                .filter(skill -> 
                    requiredSkillNames.contains(skill.getName().toLowerCase())
                )
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> findPotentialTeamMembersForProject(Long projectId) {
        List<SkillDto> matchingSkills = findMatchingSkillsForProject(projectId);
        
        return matchingSkills.stream()
                .map(skill -> userService.getUserById(skill.getUserId()))
                .distinct()
                .collect(Collectors.toList());
    }
}
