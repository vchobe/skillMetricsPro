package com.skillmetrics.api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
public class JwtAuthorizationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthorizationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        final String header = request.getHeader("Authorization");
        
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        
        try {
            String token = header.replace("Bearer ", "");
            
            // Check if token is expired
            if (jwtUtil.isTokenExpired(token)) {
                log.warn("Token is expired");
                chain.doFilter(request, response);
                return;
            }
            
            // Extract username and authorities
            String username = jwtUtil.extractUsername(token);
            List<Map<String, String>> authoritiesMaps = jwtUtil.extractClaim(token, claims -> claims.get("authorities", List.class));
            
            List<SimpleGrantedAuthority> authorities = null;
            if (authoritiesMaps != null) {
                authorities = authoritiesMaps.stream()
                        .map(m -> new SimpleGrantedAuthority(m.get("authority")))
                        .collect(Collectors.toList());
            }
            
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        username, null, authorities);
                
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            
        } catch (JwtException e) {
            log.error("Invalid JWT token", e);
        }
        
        chain.doFilter(request, response);
    }
}
