package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.Hashtable;
import java.util.List;
import java.util.regex.Pattern;

@Service
@Slf4j
public class EmailValidationService {
    
    @Value("${app.email.validation.strict-mode:true}")
    private boolean strictMode;

    // Enhanced email pattern (more strict than the basic one)
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
    );

    // List of common disposable email domains to block
    private static final List<String> DISPOSABLE_DOMAINS = List.of(
        "10minutemail.com", "guerrillamail.com", "tempmail.org", "yopmail.com",
        "mailinator.com", "temp-mail.org", "fakemailgenerator.com", "throwaway.email"
    );

    /**
     * Comprehensive email validation with multiple checks
     */
    public EmailValidationResult validateEmail(String email) {
        log.info("Starting email validation for: {} (strict mode: {})", maskEmail(email), strictMode);
        
        if (email == null || email.trim().isEmpty()) {
            log.warn("Email validation failed: Email is null or empty");
            return new EmailValidationResult(false, "Email is required", "EMPTY_EMAIL");
        }

        email = email.trim().toLowerCase();

        // 1. Basic format validation
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            log.warn("Email validation failed for {}: Invalid format", maskEmail(email));
            return new EmailValidationResult(false, "Please provide a valid email format", "INVALID_FORMAT");
        }
        
        // If strict mode is disabled, only do basic format validation
        if (!strictMode) {
            log.info("Email validation successful for: {} (non-strict mode)", maskEmail(email));
            return new EmailValidationResult(true, "Email is valid (non-strict mode)", "SUCCESS");
        }

        // 2. Additional format checks
        if (email.length() > 254) {
            log.warn("Email validation failed for {}: Email too long ({} characters)", maskEmail(email), email.length());
            return new EmailValidationResult(false, "Email address is too long", "TOO_LONG");
        }
        
        String[] parts = email.split("@");
        if (parts.length != 2 || parts[0].length() > 64) {
            log.warn("Email validation failed for {}: Invalid email structure", maskEmail(email));
            return new EmailValidationResult(false, "Invalid email format", "INVALID_STRUCTURE");
        }

        // 3. Check for disposable email domains
        String domain = email.substring(email.indexOf('@') + 1);
        if (DISPOSABLE_DOMAINS.contains(domain)) {
            log.warn("Email validation failed for {}: Disposable domain detected: {}", maskEmail(email), domain);
            return new EmailValidationResult(false, "Disposable email addresses are not allowed", "DISPOSABLE_DOMAIN");
        }

        // 4. DNS MX Record validation
        log.debug("Checking MX record for domain: {}", domain);
        if (!hasMXRecord(domain)) {
            log.warn("Email validation failed for {}: No MX record found for domain: {}", maskEmail(email), domain);
            return new EmailValidationResult(false, "Email domain does not exist or cannot receive emails", "NO_MX_RECORD");
        }

        // 5. SMTP validation (check if mailbox exists)
        log.debug("Starting SMTP validation for: {}", maskEmail(email));
        SMTPValidationResult smtpResult = validateSMTP(email, domain);
        if (!smtpResult.isValid()) {
            log.warn("Email validation failed for {}: SMTP validation failed: {}", maskEmail(email), smtpResult.getMessage());
            return new EmailValidationResult(false, smtpResult.getMessage(), smtpResult.getErrorCode());
        }

        log.info("Email validation successful for: {}", maskEmail(email));
        return new EmailValidationResult(true, "Email is valid and exists", "SUCCESS");
    }

    /**
     * Check if domain has MX records (can receive emails)
     */
    private boolean hasMXRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("com.sun.jndi.dns.timeout.initial", "5000"); // 5 second timeout
            env.put("com.sun.jndi.dns.timeout.retries", "1"); // Only 1 retry
            DirContext dirContext = new InitialDirContext(env);
            
            Attributes attrs = dirContext.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");
            
            boolean hasMX = attr != null && attr.size() > 0;
            dirContext.close();
            
            log.debug("MX record check for {}: {}", domain, hasMX);
            return hasMX;
            
        } catch (NamingException e) {
            log.warn("Failed to check MX record for domain {}: {}", domain, e.getMessage());
            return false;
        }
    }

    /**
     * SMTP validation to check if the email address actually exists
     */
    private SMTPValidationResult validateSMTP(String email, String domain) {
        try {
            // Get MX record
            String mxRecord = getMXRecord(domain);
            if (mxRecord == null) {
                return new SMTPValidationResult(false, "No mail server found for domain", "NO_MAIL_SERVER");
            }

            // Connect to SMTP server with timeout
            Socket socket = new Socket();
            socket.setSoTimeout(5000); // 5 second read timeout
            socket.connect(new java.net.InetSocketAddress(mxRecord, 25), 10000); // 10 second connect timeout
            
            try (Socket socketResource = socket;
                 PrintWriter writer = new PrintWriter(socketResource.getOutputStream(), true);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(socketResource.getInputStream()))) {

                // SMTP conversation
                String response = reader.readLine();
                if (!response.startsWith("220")) {
                    return new SMTPValidationResult(false, "Mail server not responding properly", "SMTP_CONNECTION_FAILED");
                }

                writer.println("HELO academy.com");
                response = reader.readLine();
                if (!response.startsWith("250")) {
                    return new SMTPValidationResult(false, "SMTP handshake failed", "SMTP_HANDSHAKE_FAILED");
                }

                writer.println("MAIL FROM:<test@academy.com>");
                response = reader.readLine();
                if (!response.startsWith("250")) {
                    return new SMTPValidationResult(false, "SMTP sender rejected", "SMTP_SENDER_REJECTED");
                }

                writer.println("RCPT TO:<" + email + ">");
                response = reader.readLine();
                if (response.startsWith("250")) {
                    writer.println("QUIT");
                    return new SMTPValidationResult(true, "Email address exists", "SUCCESS");
                } else if (response.startsWith("550") || response.startsWith("551") || response.startsWith("553")) {
                    writer.println("QUIT");
                    return new SMTPValidationResult(false, "Email address does not exist", "MAILBOX_NOT_FOUND");
                } else {
                    writer.println("QUIT");
                    return new SMTPValidationResult(false, "Unable to verify email existence", "SMTP_VERIFICATION_FAILED");
                }

            }
        } catch (Exception e) {
            log.warn("SMTP validation failed for {}: {}", maskEmail(email), e.getMessage());
            // Don't fail validation entirely - some servers block SMTP verification
            return new SMTPValidationResult(true, "Email format valid (SMTP verification unavailable)", "SMTP_UNAVAILABLE");
        }
    }

    /**
     * Get the primary MX record for a domain
     */
    private String getMXRecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("com.sun.jndi.dns.timeout.initial", "5000"); // 5 second timeout
            env.put("com.sun.jndi.dns.timeout.retries", "1"); // Only 1 retry
            DirContext dirContext = new InitialDirContext(env);
            
            Attributes attrs = dirContext.getAttributes(domain, new String[]{"MX"});
            Attribute attr = attrs.get("MX");
            
            if (attr != null && attr.size() > 0) {
                String mxRecord = attr.get(0).toString();
                // MX record format: "priority hostname"
                String[] parts = mxRecord.split(" ");
                if (parts.length >= 2) {
                    String hostname = parts[1];
                    // Remove trailing dot if present
                    if (hostname.endsWith(".")) {
                        hostname = hostname.substring(0, hostname.length() - 1);
                    }
                    dirContext.close();
                    return hostname;
                }
            }
            
            dirContext.close();
            return null;
            
        } catch (NamingException e) {
            log.warn("Failed to get MX record for domain {}: {}", domain, e.getMessage());
            return null;
        }
    }

    /**
     * Mask email for logging (privacy protection)
     */
    private String maskEmail(String email) {
        if (email == null || email.length() < 3) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        String localPart = email.substring(0, atIndex);
        String domain = email.substring(atIndex);
        
        if (localPart.length() <= 2) {
            return localPart.charAt(0) + "*" + domain;
        } else {
            return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + domain;
        }
    }

    // Result classes
    public static class EmailValidationResult {
        private final boolean valid;
        private final String message;
        private final String errorCode;

        public EmailValidationResult(boolean valid, String message) {
            this(valid, message, null);
        }

        public EmailValidationResult(boolean valid, String message, String errorCode) {
            this.valid = valid;
            this.message = message;
            this.errorCode = errorCode;
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public String getErrorCode() { return errorCode; }
    }

    private static class SMTPValidationResult {
        private final boolean valid;
        private final String message;
        private final String errorCode;

        public SMTPValidationResult(boolean valid, String message, String errorCode) {
            this.valid = valid;
            this.message = message;
            this.errorCode = errorCode;
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public String getErrorCode() { return errorCode; }
    }
}
