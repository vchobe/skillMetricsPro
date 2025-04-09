package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ClientDto;
import com.skillmetrics.api.dto.ProjectDto;
import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.Client;
import com.skillmetrics.api.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ProjectService projectService;

    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ClientDto getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + id));
        
        return convertToDto(client);
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> getClientsByIndustry(String industry) {
        return clientRepository.findByIndustry(industry).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<String> getAllIndustries() {
        return clientRepository.findAllIndustries();
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> searchClients(String term) {
        return clientRepository.searchClients(term).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ClientDto createClient(ClientDto clientDto) {
        Client client = new Client();
        client.setName(clientDto.getName());
        client.setIndustry(clientDto.getIndustry());
        client.setContactName(clientDto.getContactName());
        client.setContactEmail(clientDto.getContactEmail());
        client.setContactPhone(clientDto.getContactPhone());
        client.setWebsite(clientDto.getWebsite());
        client.setDescription(clientDto.getDescription());
        client.setAddress(clientDto.getAddress());
        client.setLogoUrl(clientDto.getLogoUrl());
        
        Client savedClient = clientRepository.save(client);
        
        return convertToDto(savedClient);
    }
    
    @Transactional
    public ClientDto updateClient(Long id, ClientDto clientDto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + id));
        
        client.setName(clientDto.getName());
        client.setIndustry(clientDto.getIndustry());
        client.setContactName(clientDto.getContactName());
        client.setContactEmail(clientDto.getContactEmail());
        client.setContactPhone(clientDto.getContactPhone());
        client.setWebsite(clientDto.getWebsite());
        client.setDescription(clientDto.getDescription());
        client.setAddress(clientDto.getAddress());
        client.setLogoUrl(clientDto.getLogoUrl());
        
        Client updatedClient = clientRepository.save(client);
        
        return convertToDto(updatedClient);
    }
    
    @Transactional
    public void deleteClient(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + id));
        
        // Check if client has any projects
        if (client.getProjects() != null && !client.getProjects().isEmpty()) {
            throw new IllegalStateException("Cannot delete client that has associated projects");
        }
        
        clientRepository.delete(client);
    }
    
    @Transactional(readOnly = true)
    public List<ProjectDto> getProjectsByClientId(Long clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id " + clientId));
        
        return projectService.getProjectsByClientId(clientId);
    }
    
    // Helper methods
    
    private ClientDto convertToDto(Client client) {
        return ClientDto.builder()
                .id(client.getId())
                .name(client.getName())
                .industry(client.getIndustry())
                .contactName(client.getContactName())
                .contactEmail(client.getContactEmail())
                .contactPhone(client.getContactPhone())
                .website(client.getWebsite())
                .description(client.getDescription())
                .address(client.getAddress())
                .logoUrl(client.getLogoUrl())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
                .build();
    }
}
