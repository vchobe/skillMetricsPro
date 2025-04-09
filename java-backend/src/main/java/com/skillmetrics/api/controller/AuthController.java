package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.*;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.security.CurrentUser;
import com.skillmetrics.api.security.JwtTokenProvider;
import com.skillmetrics.api.security.UserPrincipal;
import com.skillmetrics.api.service.EmailService;
import com.skillmetrics.api.service.TokenService;
import com.skillmetrics.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final TokenService tokenService;
    private final EmailService emailService;

    @PostMapping("/login")
    public ResponseEntity<JwtAuthenticationResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        return ResponseEntity.ok(new JwtAuthenticationResponse(jwt));
    }

    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser(@Valid @RequestBody SignUpRequest signUpRequest) {
        // Check if the email is already in use
        if (userRepository.findByEmail(signUpRequest.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        // Create user
        UserDto userDto = new UserDto();
        userDto.setEmail(signUpRequest.getEmail());
        userDto.setPassword(passwordEncoder.encode(signUpRequest.getPassword()));
        userDto.setFirstName(signUpRequest.getFirstName());
        userDto.setLastName(signUpRequest.getLastName());
        userDto.setRole("ROLE_USER");
        userDto.setEmailVerified(false);

        UserDto createdUser = userService.createUser(userDto);

        // Send verification email
        User user = userRepository.findById(createdUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createdUser.getId()));
        
        String token = tokenService.createEmailVerificationToken(user.getId());
        emailService.sendVerificationEmail(user, token);

        return ResponseEntity.ok(createdUser);
    }

    @GetMapping("/verify-email")
    public RedirectView verifyEmail(@RequestParam("token") String token) {
        boolean isValid = tokenService.validateToken(token, "EMAIL_VERIFICATION");
        
        if (!isValid) {
            return new RedirectView("/email-verification-failed");
        }
        
        User user = tokenService.consumeToken(token, "EMAIL_VERIFICATION");
        user.setEmailVerified(true);
        userRepository.save(user);
        
        emailService.sendWelcomeEmail(user);
        
        return new RedirectView("/email-verification-success");
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerificationEmail(@Valid @RequestBody EmailRequest emailRequest) {
        User user = userRepository.findByEmail(emailRequest.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + emailRequest.getEmail()));
        
        if (user.getEmailVerified()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already verified"));
        }
        
        String token = tokenService.createEmailVerificationToken(user.getId());
        emailService.sendVerificationEmail(user, token);
        
        return ResponseEntity.ok(Map.of("message", "Verification email sent"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));
        
        String token = tokenService.createPasswordResetToken(user.getId());
        emailService.sendPasswordResetEmail(user, token);
        
        return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody PasswordResetRequest request) {
        boolean isValid = tokenService.validateToken(request.getToken(), "PASSWORD_RESET");
        
        if (!isValid) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid or expired token"));
        }
        
        User user = tokenService.consumeToken(request.getToken(), "PASSWORD_RESET");
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Password reset successful"));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody PasswordChangeRequest request,
            @CurrentUser UserPrincipal currentUser) {
        
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));
        
        // Check if old password is correct
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password is incorrect"));
        }
        
        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDto> getCurrentUser(@CurrentUser UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUser.getId()));
        
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setEmail(user.getEmail());
        userDto.setFirstName(user.getFirstName());
        userDto.setLastName(user.getLastName());
        userDto.setRole(user.getRole());
        userDto.setEmailVerified(user.getEmailVerified());
        
        return ResponseEntity.ok(userDto);
    }
    
    @PostMapping("/check-token")
    public ResponseEntity<Map<String, Object>> checkToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String tokenType = request.get("tokenType");
        
        if (token == null || tokenType == null) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", "Invalid request"));
        }
        
        boolean isValid = tokenService.validateToken(token, tokenType);
        Map<String, Object> response = new HashMap<>();
        response.put("valid", isValid);
        
        if (isValid) {
            try {
                User user = tokenService.getUserFromToken(token);
                response.put("userId", user.getId());
                response.put("email", user.getEmail());
            } catch (Exception e) {
                // No need to handle, just won't include user info
            }
        }
        
        return ResponseEntity.ok(response);
    }
}