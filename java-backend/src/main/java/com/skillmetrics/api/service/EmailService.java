package com.skillmetrics.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    
    @Value("${spring.mail.username:noreply@skillmetrics.com}")
    private String fromEmail;
    
    @Value("${app.client-base-url:http://localhost:5173}")
    private String clientBaseUrl;
    
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Simple email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
    
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("HTML email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
        }
    }
    
    @Async
    public void sendTemplatedEmail(String to, String subject, String templateName, Context context) {
        try {
            String htmlContent = templateEngine.process(templateName, context);
            sendHtmlEmail(to, subject, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send templated email to {}: {}", to, e.getMessage());
        }
    }
    
    @Async
    public void sendWelcomeEmail(String to, String name) {
        try {
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("clientBaseUrl", clientBaseUrl);
            
            String htmlContent = templateEngine.process("welcome-email", context);
            sendHtmlEmail(to, "Welcome to SkillMetrics!", htmlContent);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}: {}", to, e.getMessage());
            // Fallback to simple email if templating fails
            String text = String.format("Hello %s,\n\nWelcome to SkillMetrics! " +
                    "We're excited to have you on board. " +
                    "You can now start tracking your professional skills and collaborate with your team.\n\n" +
                    "Visit %s to get started.\n\n" +
                    "Best regards,\nThe SkillMetrics Team", name, clientBaseUrl);
            
            sendSimpleEmail(to, "Welcome to SkillMetrics!", text);
        }
    }
    
    @Async
    public void sendPasswordResetEmail(String to, String name, String token) {
        try {
            String resetLink = clientBaseUrl + "/reset-password?token=" + token;
            
            Context context = new Context();
            context.setVariable("name", name);
            context.setVariable("resetLink", resetLink);
            context.setVariable("clientBaseUrl", clientBaseUrl);
            
            String htmlContent = templateEngine.process("password-reset-email", context);
            sendHtmlEmail(to, "Reset Your SkillMetrics Password", htmlContent);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
            // Fallback to simple email if templating fails
            String text = String.format("Hello %s,\n\nYou requested a password reset for your SkillMetrics account. " +
                    "Please click the link below to reset your password:\n\n" +
                    "%s/reset-password?token=%s\n\n" +
                    "If you didn't request this, please ignore this email.\n\n" +
                    "Best regards,\nThe SkillMetrics Team", name, clientBaseUrl, token);
            
            sendSimpleEmail(to, "Reset Your SkillMetrics Password", text);
        }
    }
    
    @Async
    public void sendSkillEndorsementEmail(String to, String recipientName, String endorserName, String skillName) {
        try {
            Context context = new Context();
            context.setVariable("recipientName", recipientName);
            context.setVariable("endorserName", endorserName);
            context.setVariable("skillName", skillName);
            context.setVariable("clientBaseUrl", clientBaseUrl);
            
            String htmlContent = templateEngine.process("endorsement-email", context);
            sendHtmlEmail(to, endorserName + " has endorsed your " + skillName + " skill!", htmlContent);
        } catch (Exception e) {
            log.error("Failed to send endorsement email to {}: {}", to, e.getMessage());
            // Fallback to simple email if templating fails
            String text = String.format("Hello %s,\n\n%s has endorsed your %s skill on SkillMetrics! " +
                    "Login to view your updated profile and endorsements.\n\n" +
                    "Visit %s to see more details.\n\n" +
                    "Best regards,\nThe SkillMetrics Team", recipientName, endorserName, skillName, clientBaseUrl);
            
            sendSimpleEmail(to, endorserName + " has endorsed your " + skillName + " skill!", text);
        }
    }
    
    @Async
    public void sendProjectAssignmentEmail(String to, String userName, String projectName, String role) {
        try {
            Context context = new Context();
            context.setVariable("userName", userName);
            context.setVariable("projectName", projectName);
            context.setVariable("role", role);
            context.setVariable("clientBaseUrl", clientBaseUrl);
            
            String htmlContent = templateEngine.process("project-assignment-email", context);
            sendHtmlEmail(to, "You've been assigned to a new project: " + projectName, htmlContent);
        } catch (Exception e) {
            log.error("Failed to send project assignment email to {}: {}", to, e.getMessage());
            // Fallback to simple email if templating fails
            String text = String.format("Hello %s,\n\nYou have been assigned to the project \"%s\" as \"%s\". " +
                    "Login to SkillMetrics to view your project details and responsibilities.\n\n" +
                    "Visit %s to see more information.\n\n" +
                    "Best regards,\nThe SkillMetrics Team", userName, projectName, role, clientBaseUrl);
            
            sendSimpleEmail(to, "You've been assigned to a new project: " + projectName, text);
        }
    }
}
