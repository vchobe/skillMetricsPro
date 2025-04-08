package com.skillmetrics.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(min = 1, max = 100, message = "Client name must be between 1 and 100 characters")
    private String name;
    
    private String industry;
    
    private String contactName;
    
    @Email(message = "Invalid email format")
    private String contactEmail;
    
    private String contactPhone;
    
    private String website;
    
    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;
    
    private String address;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
