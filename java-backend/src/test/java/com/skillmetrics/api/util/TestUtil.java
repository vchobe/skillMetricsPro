package com.skillmetrics.api.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Utility class for API testing.
 * Provides common methods for API testing.
 */
public class TestUtil {

    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    /**
     * Convert an object to JSON string.
     */
    public static String asJsonString(final Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Convert JSON string to an object.
     */
    public static <T> T fromJsonString(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * Set up authentication context for a user.
     */
    public static void setUpUserAuthentication(String username, String... roles) {
        List<SimpleGrantedAuthority> authorities = Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
        
        Authentication auth = new UsernamePasswordAuthenticationToken(
                username, "password", authorities);
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    /**
     * Clear authentication context.
     */
    public static void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Build a GET request.
     */
    public static MockHttpServletRequestBuilder getRequest(String url) {
        return MockMvcRequestBuilders.get(url)
                .contentType(MediaType.APPLICATION_JSON);
    }

    /**
     * Build a POST request with a body.
     */
    public static MockHttpServletRequestBuilder postRequest(String url, Object body) {
        return MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(body));
    }

    /**
     * Build a PUT request with a body.
     */
    public static MockHttpServletRequestBuilder putRequest(String url, Object body) {
        return MockMvcRequestBuilders.put(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(asJsonString(body));
    }

    /**
     * Build a DELETE request.
     */
    public static MockHttpServletRequestBuilder deleteRequest(String url) {
        return MockMvcRequestBuilders.delete(url)
                .contentType(MediaType.APPLICATION_JSON);
    }

    /**
     * Extract the response content as a string.
     */
    public static String getContentAsString(MvcResult result) throws Exception {
        return result.getResponse().getContentAsString();
    }
}