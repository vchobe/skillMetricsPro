package com.skillmetrics.api.dto;

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
public class ClientDto {

    private Long id;
    
    @NotBlank(message = "Client name is required")
    private String name;
    
    private String industry;
    
    private String contactName;
    
    @Email(message = "Invalid email format")
    private String contactEmail;
    
    private String contactPhone;
    
    private String website;
    
    private String description;
    
    private String address;
    
    private String logoUrl;
    
    private List<ProjectDto> projects;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
