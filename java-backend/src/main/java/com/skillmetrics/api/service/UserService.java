package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.UserDto;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public UserDto getUserById(Long id) {
        return userRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }
    
    public UserDto getUserByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("User not found with username " + username));
    }
    
    public UserDto getUserByEmail(String email) {
        return userRepository.findByEmail(email)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("User not found with email " + email));
    }
    
    public UserDto createUser(UserDto userDto, String password) {
        if (userRepository.existsByUsername(userDto.getUsername())) {
            throw new RuntimeException("Username already taken: " + userDto.getUsername());
        }
        
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Email already in use: " + userDto.getEmail());
        }
        
        User user = convertToEntity(userDto);
        user.setPassword(passwordEncoder.encode(password));
        user.setCreatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return convertToDto(user);
    }
    
    public UserDto updateUser(Long id, UserDto userDto) {
        return userRepository.findById(id)
            .map(user -> {
                // Check if username is being changed and if it's already taken
                if (!user.getUsername().equals(userDto.getUsername()) && 
                    userRepository.existsByUsername(userDto.getUsername())) {
                    throw new RuntimeException("Username already taken: " + userDto.getUsername());
                }
                
                // Check if email is being changed and if it's already in use
                if (!user.getEmail().equals(userDto.getEmail()) && 
                    userRepository.existsByEmail(userDto.getEmail())) {
                    throw new RuntimeException("Email already in use: " + userDto.getEmail());
                }
                
                user.setUsername(userDto.getUsername());
                user.setEmail(userDto.getEmail());
                user.setFirstName(userDto.getFirstName());
                user.setLastName(userDto.getLastName());
                user.setRole(userDto.getRole());
                user.setLocation(userDto.getLocation());
                user.setProject(userDto.getProject());
                user.setUpdatedAt(LocalDateTime.now());
                return convertToDto(userRepository.save(user));
            })
            .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }
    
    public void updatePassword(Long id, String newPassword) {
        userRepository.findById(id).ifPresent(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        });
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
    
    private UserDto convertToDto(User user) {
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .role(user.getRole())
            .location(user.getLocation())
            .project(user.getProject())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
    
    private User convertToEntity(UserDto userDto) {
        return User.builder()
            .id(userDto.getId())
            .username(userDto.getUsername())
            .email(userDto.getEmail())
            .firstName(userDto.getFirstName())
            .lastName(userDto.getLastName())
            .role(userDto.getRole())
            .location(userDto.getLocation())
            .project(userDto.getProject())
            .createdAt(userDto.getCreatedAt())
            .updatedAt(userDto.getUpdatedAt())
            .build();
    }
}
