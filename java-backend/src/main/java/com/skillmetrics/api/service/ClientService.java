package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ClientDto;
import com.skillmetrics.api.exception.ResourceAlreadyExistsException;
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

    @Transactional(readOnly = true)
    public List<ClientDto> getAllClients() {
        return clientRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public ClientDto getClientById(Long id) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        
        return mapToDto(client);
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> searchClientsByName(String keyword) {
        return clientRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> searchClientsByIndustry(String industry) {
        return clientRepository.findByIndustryContainingIgnoreCase(industry).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> searchClientsByContactName(String contactName) {
        return clientRepository.findByContactNameContainingIgnoreCase(contactName).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<ClientDto> searchClientsByContactEmail(String contactEmail) {
        return clientRepository.findByContactEmailContainingIgnoreCase(contactEmail).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ClientDto createClient(ClientDto clientDto) {
        // Check if client with same name already exists
        if (clientRepository.existsByName(clientDto.getName())) {
            throw new ResourceAlreadyExistsException("Client", "name", clientDto.getName());
        }
        
        Client client = new Client();
        client.setName(clientDto.getName());
        client.setIndustry(clientDto.getIndustry());
        client.setContactName(clientDto.getContactName());
        client.setContactEmail(clientDto.getContactEmail());
        client.setContactPhone(clientDto.getContactPhone());
        client.setWebsite(clientDto.getWebsite());
        client.setDescription(clientDto.getDescription());
        client.setAddress(clientDto.getAddress());
        
        Client savedClient = clientRepository.save(client);
        
        return mapToDto(savedClient);
    }
    
    @Transactional
    public ClientDto updateClient(Long id, ClientDto clientDto) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "id", id));
        
        // Check if client name is being changed and if new name is already taken by another client
        if (!client.getName().equals(clientDto.getName()) && 
                clientRepository.existsByName(clientDto.getName())) {
            throw new ResourceAlreadyExistsException("Client", "name", clientDto.getName());
        }
        
        client.setName(clientDto.getName());
        client.setIndustry(clientDto.getIndustry());
        client.setContactName(clientDto.getContactName());
        client.setContactEmail(clientDto.getContactEmail());
        client.setContactPhone(clientDto.getContactPhone());
        client.setWebsite(clientDto.getWebsite());
        client.setDescription(clientDto.getDescription());
        client.setAddress(clientDto.getAddress());
        
        Client updatedClient = clientRepository.save(client);
        
        return mapToDto(updatedClient);
    }
    
    @Transactional
    public void deleteClient(Long id) {
        if (!clientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Client", "id", id);
        }
        
        clientRepository.deleteById(id);
    }
    
    // Helper method to map Client entity to ClientDto
    private ClientDto mapToDto(Client client) {
        ClientDto clientDto = new ClientDto();
        clientDto.setId(client.getId());
        clientDto.setName(client.getName());
        clientDto.setIndustry(client.getIndustry());
        clientDto.setContactName(client.getContactName());
        clientDto.setContactEmail(client.getContactEmail());
        clientDto.setContactPhone(client.getContactPhone());
        clientDto.setWebsite(client.getWebsite());
        clientDto.setDescription(client.getDescription());
        clientDto.setAddress(client.getAddress());
        clientDto.setCreatedAt(client.getCreatedAt());
        clientDto.setUpdatedAt(client.getUpdatedAt());
        
        return clientDto;
    }
}
