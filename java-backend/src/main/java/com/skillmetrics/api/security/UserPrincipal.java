package com.skillmetrics.api.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.skillmetrics.api.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Data
@AllArgsConstructor
@Builder
public class UserPrincipal implements UserDetails {
    
    private final Long id;
    private final String username;
    private final String email;
    
    @JsonIgnore
    private final String password;
    
    private final String firstName;
    private final String lastName;
    private final String jobTitle;
    private final String location;
    private final String role;
    
    private final Collection<? extends GrantedAuthority> authorities;
    
    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + (user.getRole() != null ? user.getRole() : "USER")));
        
        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .password(user.getPassword())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .jobTitle(user.getJobTitle())
                .location(user.getLocation())
                .role(user.getRole())
                .authorities(authorities)
                .build();
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return true;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserPrincipal that = (UserPrincipal) o;
        return Objects.equals(id, that.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
