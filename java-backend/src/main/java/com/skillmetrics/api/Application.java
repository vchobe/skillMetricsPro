package com.skillmetrics.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.skillmetrics")
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
