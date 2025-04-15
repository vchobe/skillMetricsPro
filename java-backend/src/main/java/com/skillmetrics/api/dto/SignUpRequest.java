package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignUpRequest {
    
    @NotBlank
    @Size(min = 2, max = 50)
    private String firstName;
    
    @NotBlank
    @Size(min = 2, max = 50)
    private String lastName;
    
    @NotBlank
    @Size(max = 100)
    @Email
    private String email;
    
    @NotBlank
    @Size(min = 6, max = 100)
    private String password;
}