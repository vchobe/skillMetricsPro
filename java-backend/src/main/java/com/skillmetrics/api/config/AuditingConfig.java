package com.skillmetrics.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@Configuration
@EnableJpaAuditing
public class AuditingConfig {
    // This enables JPA auditing which automatically populates
    // fields annotated with @CreatedDate and @LastModifiedDate
}
