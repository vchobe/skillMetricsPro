package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest {
    
    @NotBlank
    private String usernameOrEmail;
    
    @NotBlank
    private String password;
}
