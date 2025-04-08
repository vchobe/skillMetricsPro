package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClientDto {
    
    private Long id;
    
    @NotBlank(message = "Client name is required")
    private String name;
    
    private String industry;
    
    private String contactName;
    
    @Email(message = "Please provide a valid email address")
    private String contactEmail;
    
    private String contactPhone;
    
    private String website;
    
    private String description;
    
    private String address;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
