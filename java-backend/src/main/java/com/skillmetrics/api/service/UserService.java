package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.exception.ResourceAlreadyExistsException;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
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

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        return mapToDto(user);
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        return mapToDto(user);
    }
    
    @Transactional(readOnly = true)
    public UserDto getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        
        return mapToDto(user);
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public UserDto createUser(UserDto userDto) {
        // Check if username already exists
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new ResourceAlreadyExistsException("User", "username", userDto.getUsername());
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", userDto.getEmail());
        }
        
        User user = new User();
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setRole(userDto.getRole() != null ? userDto.getRole() : "USER");
        user.setLocation(userDto.getLocation());
        user.setProject(userDto.getProject());
        user.setEnabled(true);
        
        User savedUser = userRepository.save(user);
        
        return mapToDto(savedUser);
    }
    
    @Transactional
    public UserDto updateUser(Long id, UserDto userDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        
        // Check if new username is already taken by another user
        if (!user.getUsername().equals(userDto.getUsername()) && 
                userRepository.existsByUsername(userDto.getUsername())) {
            throw new ResourceAlreadyExistsException("User", "username", userDto.getUsername());
        }
        
        // Check if new email is already taken by another user
        if (!user.getEmail().equals(userDto.getEmail()) && 
                userRepository.existsByEmail(userDto.getEmail())) {
            throw new ResourceAlreadyExistsException("User", "email", userDto.getEmail());
        }
        
        // Update user properties
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        
        // Only update password if it's provided
        if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }
        
        user.setFirstName(userDto.getFirstName());
        user.setLastName(userDto.getLastName());
        user.setRole(userDto.getRole());
        user.setLocation(userDto.getLocation());
        user.setProject(userDto.getProject());
        user.setEnabled(userDto.isEnabled());
        
        User updatedUser = userRepository.save(user);
        
        return mapToDto(updatedUser);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        
        userRepository.deleteById(id);
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> searchUsersByUsername(String keyword) {
        return userRepository.findByUsernameContainingIgnoreCase(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRole(String role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<UserDto> getUsersByLocation(String location) {
        return userRepository.findByLocation(location).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    // Helper method to map User entity to UserDto
    private UserDto mapToDto(User user) {
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setUsername(user.getUsername());
        userDto.setEmail(user.getEmail());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setRole(user.getRole());
        userDto.setLocation(user.getLocation());
        userDto.setProject(user.getProject());
        userDto.setEnabled(user.isEnabled());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setUpdatedAt(user.getUpdatedAt());
        
        return userDto;
    }
}
