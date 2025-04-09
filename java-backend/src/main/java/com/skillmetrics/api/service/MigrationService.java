package com.skillmetrics.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillmetrics.api.dto.*;
import com.skillmetrics.api.model.*;
import com.skillmetrics.api.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MigrationService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final ProjectRepository projectRepository;
    private final ClientRepository clientRepository;
    private final ProjectResourceRepository projectResourceRepository;
    private final ProjectSkillRepository projectSkillRepository;
    private final EndorsementRepository endorsementRepository;
    private final NotificationRepository notificationRepository;
    
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Integer> migrateData(MultipartFile jsonFile) throws IOException {
        Map<String, Object> data = objectMapper.readValue(
                jsonFile.getInputStream(), 
                new TypeReference<Map<String, Object>>() {});
        
        int usersCount = migrateUsers(data);
        int clientsCount = migrateClients(data);
        int projectsCount = migrateProjects(data);
        int skillsCount = migrateSkills(data);
        int projectResourcesCount = migrateProjectResources(data);
        int projectSkillsCount = migrateProjectSkills(data);
        int endorsementsCount = migrateEndorsements(data);
        int notificationsCount = migrateNotifications(data);
        
        return Map.of(
            "users", usersCount,
            "clients", clientsCount,
            "projects", projectsCount,
            "skills", skillsCount,
            "projectResources", projectResourcesCount,
            "projectSkills", projectSkillsCount,
            "endorsements", endorsementsCount,
            "notifications", notificationsCount
        );
    }
    
    @Transactional
    public Map<String, Integer> exportData() {
        // Counts of exported entities
        int usersCount = userRepository.findAll().size();
        int clientsCount = clientRepository.findAll().size();
        int projectsCount = projectRepository.findAll().size();
        int skillsCount = skillRepository.findAll().size();
        int projectResourcesCount = projectResourceRepository.findAll().size();
        int projectSkillsCount = projectSkillRepository.findAll().size();
        int endorsementsCount = endorsementRepository.findAll().size();
        int notificationsCount = notificationRepository.findAll().size();
        
        return Map.of(
            "users", usersCount,
            "clients", clientsCount,
            "projects", projectsCount,
            "skills", skillsCount,
            "projectResources", projectResourcesCount,
            "projectSkills", projectSkillsCount,
            "endorsements", endorsementsCount,
            "notifications", notificationsCount
        );
    }
    
    @SuppressWarnings("unchecked")
    private int migrateUsers(Map<String, Object> data) {
        if (!data.containsKey("users")) {
            return 0;
        }
        
        List<Map<String, Object>> users = (List<Map<String, Object>>) data.get("users");
        for (Map<String, Object> userData : users) {
            User user = new User();
            user.setId(((Number) userData.get("id")).longValue());
            user.setUsername((String) userData.get("username"));
            user.setEmail((String) userData.get("email"));
            
            // Handle password - we might need to re-encode it depending on the source
            String password = (String) userData.get("password");
            if (password != null && !password.startsWith("$2a$")) {
                password = passwordEncoder.encode(password);
            }
            user.setPassword(password);
            
            user.setFirstName((String) userData.get("firstName"));
            user.setLastName((String) userData.get("lastName"));
            user.setRole((String) userData.get("role"));
            user.setLocation((String) userData.get("location"));
            user.setDepartment((String) userData.get("department"));
            user.setJobTitle((String) userData.get("jobTitle"));
            user.setBio((String) userData.get("bio"));
            user.setProfileImageUrl((String) userData.get("profileImageUrl"));
            
            userRepository.save(user);
        }
        
        return users.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateClients(Map<String, Object> data) {
        if (!data.containsKey("clients")) {
            return 0;
        }
        
        List<Map<String, Object>> clients = (List<Map<String, Object>>) data.get("clients");
        for (Map<String, Object> clientData : clients) {
            Client client = new Client();
            client.setId(((Number) clientData.get("id")).longValue());
            client.setName((String) clientData.get("name"));
            client.setIndustry((String) clientData.get("industry"));
            client.setContactName((String) clientData.get("contactName"));
            client.setContactEmail((String) clientData.get("contactEmail"));
            client.setContactPhone((String) clientData.get("contactPhone"));
            client.setWebsite((String) clientData.get("website"));
            client.setDescription((String) clientData.get("description"));
            client.setAddress((String) clientData.get("address"));
            client.setLogoUrl((String) clientData.get("logoUrl"));
            
            clientRepository.save(client);
        }
        
        return clients.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateProjects(Map<String, Object> data) {
        if (!data.containsKey("projects")) {
            return 0;
        }
        
        List<Map<String, Object>> projects = (List<Map<String, Object>>) data.get("projects");
        for (Map<String, Object> projectData : projects) {
            Project project = new Project();
            project.setId(((Number) projectData.get("id")).longValue());
            project.setName((String) projectData.get("name"));
            project.setDescription((String) projectData.get("description"));
            
            // Handle client reference
            if (projectData.get("clientId") != null) {
                Long clientId = ((Number) projectData.get("clientId")).longValue();
                clientRepository.findById(clientId).ifPresent(project::setClient);
            }
            
            project.setStartDate(projectData.get("startDate") == null ? null : 
                java.time.LocalDate.parse((String) projectData.get("startDate")));
            project.setEndDate(projectData.get("endDate") == null ? null : 
                java.time.LocalDate.parse((String) projectData.get("endDate")));
            
            project.setLocation((String) projectData.get("location"));
            project.setConfluenceLink((String) projectData.get("confluenceLink"));
            
            // Handle lead reference
            if (projectData.get("leadId") != null) {
                Long leadId = ((Number) projectData.get("leadId")).longValue();
                userRepository.findById(leadId).ifPresent(project::setLead);
            }
            
            // Handle delivery lead reference
            if (projectData.get("deliveryLeadId") != null) {
                Long deliveryLeadId = ((Number) projectData.get("deliveryLeadId")).longValue();
                userRepository.findById(deliveryLeadId).ifPresent(project::setDeliveryLead);
            }
            
            project.setStatus((String) projectData.get("status"));
            project.setHrCoordinatorEmail((String) projectData.get("hrCoordinatorEmail"));
            project.setFinanceTeamEmail((String) projectData.get("financeTeamEmail"));
            
            projectRepository.save(project);
        }
        
        return projects.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateSkills(Map<String, Object> data) {
        if (!data.containsKey("skills")) {
            return 0;
        }
        
        List<Map<String, Object>> skills = (List<Map<String, Object>>) data.get("skills");
        for (Map<String, Object> skillData : skills) {
            Skill skill = new Skill();
            skill.setId(((Number) skillData.get("id")).longValue());
            
            // Handle user reference
            if (skillData.get("userId") != null) {
                Long userId = ((Number) skillData.get("userId")).longValue();
                userRepository.findById(userId).ifPresent(skill::setUser);
            }
            
            skill.setName((String) skillData.get("name"));
            skill.setCategory((String) skillData.get("category"));
            skill.setLevel((String) skillData.get("level"));
            skill.setDescription((String) skillData.get("description"));
            skill.setCertification((String) skillData.get("certification"));
            skill.setCredlyLink((String) skillData.get("credlyLink"));
            skill.setVerified((Boolean) skillData.getOrDefault("verified", false));
            
            skillRepository.save(skill);
        }
        
        return skills.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateProjectResources(Map<String, Object> data) {
        if (!data.containsKey("projectResources")) {
            return 0;
        }
        
        List<Map<String, Object>> resources = (List<Map<String, Object>>) data.get("projectResources");
        for (Map<String, Object> resourceData : resources) {
            ProjectResource resource = new ProjectResource();
            resource.setId(((Number) resourceData.get("id")).longValue());
            
            // Handle project reference
            if (resourceData.get("projectId") != null) {
                Long projectId = ((Number) resourceData.get("projectId")).longValue();
                projectRepository.findById(projectId).ifPresent(resource::setProject);
            }
            
            // Handle user reference
            if (resourceData.get("userId") != null) {
                Long userId = ((Number) resourceData.get("userId")).longValue();
                userRepository.findById(userId).ifPresent(resource::setUser);
            }
            
            resource.setRole((String) resourceData.get("role"));
            
            if (resourceData.get("allocation") != null) {
                resource.setAllocation(((Number) resourceData.get("allocation")).intValue());
            }
            
            resource.setStartDate(resourceData.get("startDate") == null ? null : 
                java.time.LocalDate.parse((String) resourceData.get("startDate")));
            resource.setEndDate(resourceData.get("endDate") == null ? null : 
                java.time.LocalDate.parse((String) resourceData.get("endDate")));
            
            resource.setNotes((String) resourceData.get("notes"));
            
            projectResourceRepository.save(resource);
        }
        
        return resources.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateProjectSkills(Map<String, Object> data) {
        if (!data.containsKey("projectSkills")) {
            return 0;
        }
        
        List<Map<String, Object>> projectSkills = (List<Map<String, Object>>) data.get("projectSkills");
        for (Map<String, Object> projectSkillData : projectSkills) {
            ProjectSkill projectSkill = new ProjectSkill();
            projectSkill.setId(((Number) projectSkillData.get("id")).longValue());
            
            // Handle project reference
            if (projectSkillData.get("projectId") != null) {
                Long projectId = ((Number) projectSkillData.get("projectId")).longValue();
                projectRepository.findById(projectId).ifPresent(projectSkill::setProject);
            }
            
            // Handle skill reference
            if (projectSkillData.get("skillId") != null) {
                Long skillId = ((Number) projectSkillData.get("skillId")).longValue();
                skillRepository.findById(skillId).ifPresent(projectSkill::setSkill);
            }
            
            projectSkill.setRequiredLevel((String) projectSkillData.get("requiredLevel"));
            projectSkill.setPriority(projectSkillData.get("priority") == null ? 0 : 
                ((Number) projectSkillData.get("priority")).intValue());
            projectSkill.setNotes((String) projectSkillData.get("notes"));
            
            projectSkillRepository.save(projectSkill);
        }
        
        return projectSkills.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateEndorsements(Map<String, Object> data) {
        if (!data.containsKey("endorsements")) {
            return 0;
        }
        
        List<Map<String, Object>> endorsements = (List<Map<String, Object>>) data.get("endorsements");
        for (Map<String, Object> endorsementData : endorsements) {
            Endorsement endorsement = new Endorsement();
            endorsement.setId(((Number) endorsementData.get("id")).longValue());
            
            // Handle skill reference
            if (endorsementData.get("skillId") != null) {
                Long skillId = ((Number) endorsementData.get("skillId")).longValue();
                skillRepository.findById(skillId).ifPresent(endorsement::setSkill);
            }
            
            // Handle endorser reference
            if (endorsementData.get("endorserId") != null) {
                Long endorserId = ((Number) endorsementData.get("endorserId")).longValue();
                userRepository.findById(endorserId).ifPresent(endorsement::setEndorser);
            }
            
            endorsement.setRating(endorsementData.get("rating") == null ? 0 : 
                ((Number) endorsementData.get("rating")).intValue());
            endorsement.setComment((String) endorsementData.get("comment"));
            
            endorsementRepository.save(endorsement);
        }
        
        return endorsements.size();
    }
    
    @SuppressWarnings("unchecked")
    private int migrateNotifications(Map<String, Object> data) {
        if (!data.containsKey("notifications")) {
            return 0;
        }
        
        List<Map<String, Object>> notifications = (List<Map<String, Object>>) data.get("notifications");
        for (Map<String, Object> notificationData : notifications) {
            Notification notification = new Notification();
            notification.setId(((Number) notificationData.get("id")).longValue());
            
            // Handle user reference
            if (notificationData.get("userId") != null) {
                Long userId = ((Number) notificationData.get("userId")).longValue();
                userRepository.findById(userId).ifPresent(notification::setUser);
            }
            
            notification.setType((String) notificationData.get("type"));
            notification.setMessage((String) notificationData.get("message"));
            notification.setRead((Boolean) notificationData.getOrDefault("read", false));
            
            if (notificationData.get("relatedId") != null) {
                notification.setRelatedId(((Number) notificationData.get("relatedId")).longValue());
            }
            
            notification.setRelatedType((String) notificationData.get("relatedType"));
            
            notificationRepository.save(notification);
        }
        
        return notifications.size();
    }
}
