package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ClientDto;
import com.skillmetrics.api.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ClientDto>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<ClientDto> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }
    
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ClientDto>> searchClientsByName(@RequestParam String keyword) {
        return ResponseEntity.ok(clientService.searchClientsByName(keyword));
    }
    
    @GetMapping("/industry")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ClientDto>> searchClientsByIndustry(@RequestParam String industry) {
        return ResponseEntity.ok(clientService.searchClientsByIndustry(industry));
    }
    
    @GetMapping("/contact-name")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ClientDto>> searchClientsByContactName(@RequestParam String contactName) {
        return ResponseEntity.ok(clientService.searchClientsByContactName(contactName));
    }
    
    @GetMapping("/contact-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'USER')")
    public ResponseEntity<List<ClientDto>> searchClientsByContactEmail(@RequestParam String contactEmail) {
        return ResponseEntity.ok(clientService.searchClientsByContactEmail(contactEmail));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ClientDto> createClient(@Valid @RequestBody ClientDto clientDto) {
        return ResponseEntity.ok(clientService.createClient(clientDto));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ClientDto> updateClient(
            @PathVariable Long id, 
            @Valid @RequestBody ClientDto clientDto) {
        return ResponseEntity.ok(clientService.updateClient(id, clientDto));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteClient(@PathVariable Long id) {
        clientService.deleteClient(id);
        return ResponseEntity.noContent().build();
    }
}
