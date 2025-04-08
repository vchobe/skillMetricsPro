package com.skillmetrics.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientDto {
    private Long id;
    private String name;
    private String industry;
    private String contactName;
    private String contactEmail;
    private String contactPhone;
    private String website;
    private String description;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
