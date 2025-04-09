package com.skillmetrics.api.service;

import com.skillmetrics.api.exception.ResourceNotFoundException;
import com.skillmetrics.api.model.User;
import com.skillmetrics.api.model.VerificationToken;
import com.skillmetrics.api.repository.UserRepository;
import com.skillmetrics.api.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;

    @Value("${app.token.email-verification.expiration:24}")
    private int emailVerificationExpirationHours;

    @Value("${app.token.password-reset.expiration:1}")
    private int passwordResetExpirationHours;

    /**
     * Creates a new email verification token
     */
    @Transactional
    public String createEmailVerificationToken(Long userId) {
        return createToken(userId, "EMAIL_VERIFICATION", emailVerificationExpirationHours);
    }

    /**
     * Creates a new password reset token
     */
    @Transactional
    public String createPasswordResetToken(Long userId) {
        return createToken(userId, "PASSWORD_RESET", passwordResetExpirationHours);
    }

    /**
     * Create a token of the specified type for the given user
     */
    @Transactional
    public String createToken(Long userId, String tokenType, int expirationHours) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Invalidate any existing tokens of the same type
        List<VerificationToken> existingTokens = tokenRepository.findByUserIdAndTokenType(userId, tokenType);
        existingTokens.forEach(token -> {
            token.setIsUsed(true);
            tokenRepository.save(token);
        });

        // Create a new token
        String tokenValue = UUID.randomUUID().toString();
        VerificationToken token = VerificationToken.builder()
                .token(tokenValue)
                .user(user)
                .tokenType(tokenType)
                .expiryDate(LocalDateTime.now().plusHours(expirationHours))
                .isUsed(false)
                .createdAt(LocalDateTime.now())
                .build();
        
        tokenRepository.save(token);
        
        return tokenValue;
    }

    /**
     * Validates a token
     */
    @Transactional(readOnly = true)
    public boolean validateToken(String tokenValue, String tokenType) {
        VerificationToken token = tokenRepository.findByToken(tokenValue)
                .orElse(null);
        
        if (token == null || !token.getTokenType().equals(tokenType) || token.getIsUsed() || token.isExpired()) {
            return false;
        }
        
        return true;
    }

    /**
     * Consumes a token (marks it as used)
     * @return The user associated with the token
     */
    @Transactional
    public User consumeToken(String tokenValue, String tokenType) {
        VerificationToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenValue));
        
        if (!token.getTokenType().equals(tokenType)) {
            throw new IllegalArgumentException("Invalid token type");
        }
        
        if (token.getIsUsed()) {
            throw new IllegalArgumentException("Token has already been used");
        }
        
        if (token.isExpired()) {
            throw new IllegalArgumentException("Token has expired");
        }
        
        token.setIsUsed(true);
        tokenRepository.save(token);
        
        return token.getUser();
    }

    /**
     * Gets the user associated with a token
     */
    @Transactional(readOnly = true)
    public User getUserFromToken(String tokenValue) {
        VerificationToken token = tokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new ResourceNotFoundException("Token not found: " + tokenValue));
        
        return token.getUser();
    }
}