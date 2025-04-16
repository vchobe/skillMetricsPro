package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    
    private String token;
    
    private Long userId;
    
    private String username;
    
    private String email;
    
    private String firstName;
    
    private String lastName;
    
    private String role;
}
