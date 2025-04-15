package com.skillmetrics.api.service;

import com.skillmetrics.api.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${app.email.from:noreply@skillmetrics.com}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    /**
     * Send email asynchronously
     */
    @Async
    public void sendEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, 
                    MimeMessageHelper.MULTIPART_MODE_MIXED, 
                    StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}", to, e);
        }
    }

    /**
     * Send verification email
     */
    public void sendVerificationEmail(User user, String token) {
        Context context = new Context();
        context.setVariable("name", user.getFirstName() + " " + user.getLastName());
        context.setVariable("verificationUrl", baseUrl + "/api/auth/verify-email?token=" + token);
        
        String htmlBody = templateEngine.process("verify-email", context);
        
        sendEmail(user.getEmail(), "Verify Your SkillMetrics Account", htmlBody);
    }

    /**
     * Send password reset email
     */
    public void sendPasswordResetEmail(User user, String token) {
        Context context = new Context();
        context.setVariable("name", user.getFirstName() + " " + user.getLastName());
        context.setVariable("resetUrl", baseUrl + "/reset-password?token=" + token);
        
        String htmlBody = templateEngine.process("reset-password", context);
        
        sendEmail(user.getEmail(), "Reset Your SkillMetrics Password", htmlBody);
    }

    /**
     * Send welcome email
     */
    public void sendWelcomeEmail(User user) {
        Context context = new Context();
        context.setVariable("name", user.getFirstName() + " " + user.getLastName());
        context.setVariable("loginUrl", baseUrl + "/login");
        
        String htmlBody = templateEngine.process("welcome", context);
        
        sendEmail(user.getEmail(), "Welcome to SkillMetrics", htmlBody);
    }

    /**
     * Send notification email
     */
    public void sendNotificationEmail(User user, String subject, String message) {
        Context context = new Context();
        context.setVariable("name", user.getFirstName() + " " + user.getLastName());
        context.setVariable("message", message);
        context.setVariable("loginUrl", baseUrl + "/login");
        
        String htmlBody = templateEngine.process("notification", context);
        
        sendEmail(user.getEmail(), subject, htmlBody);
    }
}