package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.RegisterRequest;
import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        
        return convertToDto(user);
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username " + username));
        
        return convertToDto(user);
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email " + email));
        
        return convertToDto(user);
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(String role) {
        String prefixedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        
        return userRepository.findByRole(prefixedRole).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> searchUsers(String term) {
        return userRepository.searchUsers(term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public UserDto registerUser(RegisterRequest registerRequest) {
        // Check if username is already taken
        if (userRepository.findByUsername(registerRequest.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        
        // Check if email is already registered
        if (userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }
        
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFirstName(registerRequest.getFirstName());
        user.setLastName(registerRequest.getLastName());
        user.setRole("ROLE_USER"); // Default role for new registrations
        user.setLocation(registerRequest.getLocation());
        user.setDepartment(registerRequest.getDepartment());
        user.setJobTitle(registerRequest.getJobTitle());
        
        User savedUser = userRepository.save(user);
        
        // Send welcome email
        emailService.sendWelcomeEmail(
                user.getEmail(), 
                (user.getFirstName() != null ? user.getFirstName() : user.getUsername())
        );
        
        return convertToDto(savedUser);
    }
    
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        
        // If email is being changed, check if it's already in use
        if (!user.getEmail().equals(userDto.getEmail()) && 
                userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }
        
        // If username is being changed, check if it's already taken
        if (!user.getUsername().equals(userDto.getUsername()) && 
                userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        
        // Only update password if it's provided and not empty
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        
        // Only allow role changes for admin users (should be checked in controller)
        if (userDto.getRole() != null && !userDto.getRole().isEmpty()) {
            String prefixedRole = userDto.getRole().startsWith("ROLE_") ? 
                    userDto.getRole() : "ROLE_" + userDto.getRole();
            user.setRole(prefixedRole);
        }
        
        user.setLocation(userDto.getLocation());
        user.setDepartment(userDto.getDepartment());
        user.setJobTitle(userDto.getJobTitle());
        user.setBio(userDto.getBio());
        user.setProfileImageUrl(userDto.getProfileImageUrl());
        
        User updatedUser = userRepository.save(user);
        
        return convertToDto(updatedUser);
    }
    
    @Transactional
    public UserDto updatePassword(Long id, String currentPassword, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        User updatedUser = userRepository.save(user);
        
        return convertToDto(updatedUser);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));
        
        userRepository.delete(user);
    }
    
    // Helper methods
    
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                // Don't include password in DTO for security reasons
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .location(user.getLocation())
                .department(user.getDepartment())
                .jobTitle(user.getJobTitle())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
    
    /**
     * Implementation of UserDetailsService interface method
     * Used by Spring Security for authentication
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        
        return new UserPrincipal(user);
    }
}
