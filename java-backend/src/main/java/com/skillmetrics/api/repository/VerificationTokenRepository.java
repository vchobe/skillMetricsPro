package com.skillmetrics.api.repository;

import com.skillmetrics.api.model.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    
    Optional<VerificationToken> findByToken(String token);
    
    List<VerificationToken> findByUserIdAndTokenType(Long userId, String tokenType);
    
    Optional<VerificationToken> findByUserIdAndTokenTypeAndIsUsed(Long userId, String tokenType, Boolean isUsed);
}