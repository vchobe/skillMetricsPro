package com.skillmetrics.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SkillMetricsApplication {

    public static void main(String[] args) {
        SpringApplication.run(SkillMetricsApplication.class, args);
    }
}
