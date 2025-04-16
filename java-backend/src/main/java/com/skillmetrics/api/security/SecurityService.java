package com.skillmetrics.api.security;

import com.skillmetrics.api.model.Skill;
import com.skillmetrics.api.repository.SkillRepository;
import com.skillmetrics.api.service.SkillService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class SecurityService {

    private final SkillRepository skillRepository;

    public SecurityService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    /**
     * Checks if the currently authenticated user is the same as the user with the given ID.
     * Used for authorization in controllers.
     * 
     * @param userId ID of the user to check against
     * @return true if the current user is the same as the user with the given ID, false otherwise
     */
    public boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            // Here we'd need to check if the username belongs to the user with userId
            // This implementation assumes the username is the user's ID
            return userId.toString().equals(username);
        }
        
        return false;
    }
    
    /**
     * Checks if the currently authenticated user is the owner of the skill.
     * Used for authorization in controllers.
     * 
     * @param skillId ID of the skill to check ownership
     * @return true if the current user is the owner of the skill, false otherwise
     */
    public boolean isOwnerOfSkill(Long skillId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            String username = ((UserDetails) principal).getUsername();
            UserDetails userDetails = (UserDetails) principal;
            
            // First check if user has admin role
            boolean isAdmin = userDetails.getAuthorities().stream()
                           .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                           
            if (isAdmin) {
                return true;
            }
            
            // Then check if user is the owner of the skill
            return skillRepository.findById(skillId)
                    .map(skill -> skill.getUser().getUsername().equals(username))
                    .orElse(false);
        }
        
        return false;
    }
    
    /**
     * Checks if the currently authenticated user has the specified user ID or is an admin.
     * 
     * @param userId User ID to check
     * @return true if the current user has the specified ID or is an admin, false otherwise
     */
    public boolean isUserOrAdmin(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof UserDetails) {
            UserDetails userDetails = (UserDetails) principal;
            
            // Compare the username or check if the user has admin role
            return userDetails.getUsername().equals(userId.toString()) || 
                   userDetails.getAuthorities().stream()
                             .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        }
        
        return false;
    }
}
