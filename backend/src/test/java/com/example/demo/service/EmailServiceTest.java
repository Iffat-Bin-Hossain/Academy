package com.example.demo.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.mail.internet.MimeMessage;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@TestPropertySource(properties = {
    "app.email.from=test@academy.com",
    "app.email.from-name=Academy Platform Test",
    "spring.mail.username=test@gmail.com"
})
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    private EmailService emailService;

    @BeforeEach
    void setUp() {
        emailService = new EmailService(mailSender);
        ReflectionTestUtils.setField(emailService, "fromEmail", "test@academy.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Academy Platform Test");
        ReflectionTestUtils.setField(emailService, "smtpUsername", "test@gmail.com");
    }

    @Test
    void testSendWelcomeEmail_WithValidSMTP_ShouldSendEmail() throws Exception {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendWelcomeEmail("user@example.com", "John Doe");

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void testSendApprovalNotification_WithValidSMTP_ShouldSendEmail() throws Exception {
        // Arrange
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        // Act
        emailService.sendApprovalNotification("user@example.com", "John Doe");

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    void testSendWelcomeEmail_WithSMTPFailure_ShouldFallbackToLogging() throws Exception {
        // Arrange
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP failed"));

        // Act
        emailService.sendWelcomeEmail("user@example.com", "John Doe");

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
        // In a real test, you might want to capture log output to verify fallback behavior
    }

    @Test
    void testSendApprovalNotification_WithSMTPFailure_ShouldFallbackToLogging() throws Exception {
        // Arrange
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("SMTP failed"));

        // Act
        emailService.sendApprovalNotification("user@example.com", "John Doe");

        // Assert
        verify(mailSender, times(1)).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void testSendWelcomeEmail_WithUnconfiguredSMTP_ShouldFallbackToLogging() {
        // Arrange
        ReflectionTestUtils.setField(emailService, "smtpUsername", "your-email@gmail.com");

        // Act
        emailService.sendWelcomeEmail("user@example.com", "John Doe");

        // Assert
        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void testSendApprovalNotification_WithUnconfiguredSMTP_ShouldFallbackToLogging() {
        // Arrange
        ReflectionTestUtils.setField(emailService, "smtpUsername", "your-email@gmail.com");

        // Act
        emailService.sendApprovalNotification("user@example.com", "John Doe");

        // Assert
        verify(mailSender, never()).createMimeMessage();
        verify(mailSender, never()).send(any(MimeMessage.class));
    }
}
