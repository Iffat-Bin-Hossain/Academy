package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    public void sendApprovalNotification(String toEmail, String userName) {
        String subject = "Account Approved - Academy Platform";
        String htmlContent = buildApprovalEmailTemplate(userName);

        try {
            sendEmail(toEmail, subject, htmlContent);
            log.info("Approval notification sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send approval notification to: {}. Falling back to logging.", toEmail, e);
            logEmailFallback(toEmail, subject, "Dear " + userName + ", your account has been approved! You can now log in to the Academy Platform.");
        }
    }

    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Welcome to Academy Platform";
        String htmlContent = buildWelcomeEmailTemplate(userName);

        try {
            sendEmail(toEmail, subject, htmlContent);
            log.info("Welcome email sent successfully to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send welcome email to: {}. Falling back to logging.", toEmail, e);
            logEmailFallback(toEmail, subject, "Dear " + userName + ", thank you for signing up! Your account is pending admin approval.");
        }
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) throws MessagingException {
        // Check if SMTP is properly configured
        if ("your-email@gmail.com".equals(smtpUsername)) {
            throw new RuntimeException("SMTP not configured - using fallback logging");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new MessagingException("Failed to send email", e);
        }
    }

    private void logEmailFallback(String toEmail, String subject, String plainMessage) {
        log.info("=== EMAIL NOTIFICATION (FALLBACK) ===");
        log.info("TO: {}", toEmail);
        log.info("SUBJECT: {}", subject);
        log.info("MESSAGE: {}", plainMessage);
        log.info("======================================");
    }

    private String buildWelcomeEmailTemplate(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Welcome to Academy Platform</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Academy Platform</h1>
                    </div>
                    <div class="content">
                        <h2>Hello %s!</h2>
                        <p>Thank you for signing up for the Academy Platform. We're excited to have you join our community!</p>
                        <p><strong>What happens next?</strong></p>
                        <ul>
                            <li>Your account is currently pending admin approval</li>
                            <li>You will receive another email once your account is approved</li>
                            <li>After approval, you can log in and start using the platform</li>
                        </ul>
                        <p>If you have any questions, please don't hesitate to contact our support team.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Academy Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName);
    }

    private String buildApprovalEmailTemplate(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Account Approved</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #27ae60; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
                    .btn { display: inline-block; padding: 12px 24px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                    .success { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Account Approved!</h1>
                    </div>
                    <div class="content">
                        <div class="success">
                            <h2>Congratulations, %s!</h2>
                            <p>Your Academy Platform account has been approved by our admin team.</p>
                        </div>
                        <p><strong>You can now:</strong></p>
                        <ul>
                            <li>Log in to your account</li>
                            <li>Access all platform features</li>
                            <li>Start your learning journey</li>
                            <li>Connect with other learners</li>
                        </ul>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="#" class="btn">Login to Academy Platform</a>
                        </div>
                        <p>Welcome aboard! We're excited to see what you'll achieve.</p>
                    </div>
                    <div class="footer">
                        <p>© 2024 Academy Platform. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName);
    }
}
