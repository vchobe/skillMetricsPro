package com.skillmetrics.api.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDto {
    
    private Long id;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    private String password; // Only used for updates, not returned in responses
    
    private String firstName;
    
    private String lastName;
    
    private String role;
    
    private String location;
    
    private String department;
    
    private String jobTitle;
    
    private String bio;
    
    private String profileImageUrl;
    
    private List<SkillDto> skills;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
