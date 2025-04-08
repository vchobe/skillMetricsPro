package com.skillmetrics.api.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class SecurityService {

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
}
