package com.skillmetrics.api.controller;

import com.skillmetrics.api.dto.ClientDto;
import com.skillmetrics.api.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<List<ClientDto>> getAllClients() {
        return ResponseEntity.ok(clientService.getAllClients());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClientDto> getClientById(@PathVariable Long id) {
        return ResponseEntity.ok(clientService.getClientById(id));
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ClientDto> createClient(@Valid @RequestBody ClientDto clientDto) {
        return new ResponseEntity<>(clientService.createClient(clientDto), HttpStatus.CREATED);
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
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    @GetMapping("/industry/{industry}")
    public ResponseEntity<List<ClientDto>> getClientsByIndustry(@PathVariable String industry) {
        return ResponseEntity.ok(clientService.getClientsByIndustry(industry));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<ClientDto>> searchClientsByName(@RequestParam String keyword) {
        return ResponseEntity.ok(clientService.searchClientsByName(keyword));
    }
}
