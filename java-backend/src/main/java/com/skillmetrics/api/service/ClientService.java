package com.skillmetrics.api.service;

import com.skillmetrics.api.dto.ClientDto;
import com.skillmetrics.api.model.Client;
import com.skillmetrics.api.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientService {
    
    private final ClientRepository clientRepository;
    
    public List<ClientDto> getAllClients() {
        return clientRepository.findAll().stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ClientDto getClientById(Long id) {
        return clientRepository.findById(id)
            .map(this::convertToDto)
            .orElseThrow(() -> new RuntimeException("Client not found with id " + id));
    }
    
    public List<ClientDto> getClientsByIndustry(String industry) {
        return clientRepository.findByIndustry(industry).stream()
            .map(this::convertToDto)
            .collect(Collectors.toList());
    }
    
    public ClientDto createClient(ClientDto clientDto) {
        Client client = convertToEntity(clientDto);
        client.setCreatedAt(LocalDateTime.now());
        client = clientRepository.save(client);
        return convertToDto(client);
    }
    
    public ClientDto updateClient(Long id, ClientDto clientDto) {
        return clientRepository.findById(id)
            .map(client -> {
                client.setName(clientDto.getName());
                client.setIndustry(clientDto.getIndustry());
                client.setContactName(clientDto.getContactName());
                client.setContactEmail(clientDto.getContactEmail());
                client.setContactPhone(clientDto.getContactPhone());
                client.setWebsite(clientDto.getWebsite());
                client.setDescription(clientDto.getDescription());
                client.setAddress(clientDto.getAddress());
                client.setUpdatedAt(LocalDateTime.now());
                return convertToDto(clientRepository.save(client));
            })
            .orElseThrow(() -> new RuntimeException("Client not found with id " + id));
    }
    
    public void deleteClient(Long id) {
        clientRepository.deleteById(id);
    }
    
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
            .createdAt(client.getCreatedAt())
            .updatedAt(client.getUpdatedAt())
            .build();
    }
    
    private Client convertToEntity(ClientDto clientDto) {
        return Client.builder()
            .id(clientDto.getId())
            .name(clientDto.getName())
            .industry(clientDto.getIndustry())
            .contactName(clientDto.getContactName())
            .contactEmail(clientDto.getContactEmail())
            .contactPhone(clientDto.getContactPhone())
            .website(clientDto.getWebsite())
            .description(clientDto.getDescription())
            .address(clientDto.getAddress())
            .createdAt(clientDto.getCreatedAt())
            .updatedAt(clientDto.getUpdatedAt())
            .build();
    }
}
