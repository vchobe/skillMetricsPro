package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.AuthRequestDto;
import com.skillmetrics.api.dto.AuthResponseDto;
import com.skillmetrics.api.dto.UserRegistrationDto;
import com.skillmetrics.api.exception.ResourceAlreadyExistsException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Transactional
    public AuthResponseDto login(AuthRequestDto authRequest) {
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(authRequest.getUsername(), authRequest.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        
        User user = (User) authentication.getPrincipal();
        String token = jwtUtil.generateToken(user.getUsername());
        
        return mapToAuthResponse(user, token);
    }
    
    @Transactional
    public AuthResponseDto register(UserRegistrationDto registrationDto) {
        // Check if username already exists
        Optional<User> userByUsername = userRepository.findByUsername(registrationDto.getUsername());
        if (userByUsername.isPresent()) {
            throw new ResourceAlreadyExistsException("User", "username", registrationDto.getUsername());
        }
        
        // Check if email already exists
        Optional<User> userByEmail = userRepository.findByEmail(registrationDto.getEmail());
        if (userByEmail.isPresent()) {
            throw new ResourceAlreadyExistsException("User", "email", registrationDto.getEmail());
        }
        
        // Create new user
        User user = new User();
        user.setUsername(registrationDto.getUsername());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));
        user.setFirstName(registrationDto.getFirstName());
        user.setLastName(registrationDto.getLastName());
        user.setLocation(registrationDto.getLocation());
        user.setDepartment(registrationDto.getDepartment());
        user.setJobTitle(registrationDto.getJobTitle());
        user.setRole("ROLE_USER"); // Default role
        user.setEnabled(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setCredentialsNonExpired(true);
        
        User savedUser = userRepository.save(user);
        
        // Create welcome notification
        String userName = savedUser.getFirstName() + " " + savedUser.getLastName();
        notificationService.createWelcomeNotification(savedUser.getId(), userName.trim());
        
        // Generate authentication token
        String token = jwtUtil.generateToken(savedUser.getUsername());
        
        return mapToAuthResponse(savedUser, token);
    }
    
    private AuthResponseDto mapToAuthResponse(User user, String token) {
        AuthResponseDto response = new AuthResponseDto();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFirstName(user.getFirstName());
        response.setLastName(user.getLastName());
        response.setRole(user.getRole());
        return response;
    }
}
