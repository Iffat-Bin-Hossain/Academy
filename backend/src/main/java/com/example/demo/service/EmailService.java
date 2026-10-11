package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.email.from:${spring.mail.username:noreply@academy.com}}")
    private String fromEmail;

    @Value("${app.email.from-name:Academy Platform}")
    private String fromName;

    @Value("${spring.mail.username:your-email@gmail.com}")
    private String smtpUsername;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");

    // =========================================================================
    // 1. Account & Registration Emails
    // =========================================================================

    /**
     * Send welcome email to user upon signup (pending approval).
     */
    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Welcome to Academy Platform - Registration Received";
        String body = """
            <h2>Hello %s,</h2>
            <p>Thank you for signing up for the <strong>Academy Platform</strong>. We're excited to have you join our learning community!</p>
            
            <div class="highlight-box">
                <span class="badge-warning">Registration Status: PENDING APPROVAL</span>
                <p style="margin: 10px 0 0 0;">An administrator is currently reviewing your account registration. Once approved, you will receive an email confirmation and can sign in immediately.</p>
            </div>

            <table class="meta-table">
                <tr>
                    <td class="label">Registered Email:</td>
                    <td class="value">%s</td>
                </tr>
                <tr>
                    <td class="label">Date Submitted:</td>
                    <td class="value">%s</td>
                </tr>
            </table>

            <p>If you did not register for an Academy account, please disregard this email.</p>
            """.formatted(escape(userName), escape(toEmail), LocalDateTime.now().format(DATE_FORMATTER));

        dispatchEmail(toEmail, subject, wrapWithAcademyTemplate(subject, "Registration received - pending approval", body));
    }

    /**
     * Alert administrator(s) that a new user has signed up and needs review.
     */
    @Async
    public void sendAdminNewSignupAlert(String adminEmail, String newUserName, String newUserEmail, String role) {
        String subject = "New User Registration Pending Approval: " + newUserName;
        String body = """
            <h2>New Registration Alert</h2>
            <p>A new user has submitted a registration request on the Academy Platform and requires your review.</p>
            
            <div class="highlight-box">
                <span class="badge-warning">Action Required: Pending Admin Review</span>
                <table class="meta-table" style="margin-top: 10px;">
                    <tr>
                        <td class="label">Full Name:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Email Address:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Requested Role:</td>
                        <td class="value"><strong>%s</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Submitted At:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/login" class="btn">Open Admin Dashboard</a>
            </div>
            """.formatted(escape(newUserName), escape(newUserEmail), escape(role), LocalDateTime.now().format(DATE_FORMATTER));

        dispatchEmail(adminEmail, subject, wrapWithAcademyTemplate(subject, "New user registration pending review", body));
    }

    /**
     * Notify user that their account was approved.
     */
    @Async
    public void sendApprovalNotification(String toEmail, String userName) {
        String subject = "Account Approved - Welcome to Academy Platform";
        String body = """
            <h2>Congratulations, %s!</h2>
            <div class="highlight-box" style="border-left-color: #10b981; background-color: #f0fdf4;">
                <span class="badge-success">Account Status: APPROVED</span>
                <p style="margin: 10px 0 0 0; color: #166534;">Your Academy Platform account has been reviewed and approved by the administration. You now have full access to your courses and dashboard.</p>
            </div>

            <p><strong>Next steps:</strong></p>
            <ul>
                <li>Log in using your registered email: <strong>%s</strong></li>
                <li>Browse available courses and request enrollments</li>
                <li>Participate in discussions and track your academic progress</li>
            </ul>

            <div style="text-align: center;">
                <a href="http://localhost:3000/login" class="btn">Sign In to Your Dashboard</a>
            </div>
            """.formatted(escape(userName), escape(toEmail));

        dispatchEmail(toEmail, subject, wrapWithAcademyTemplate(subject, "Your account is now active", body));
    }

    /**
     * Notify user that their registration was rejected.
     */
    @Async
    public void sendRejectionNotification(String toEmail, String userName) {
        String subject = "Application Status Update - Academy Platform";
        String body = """
            <h2>Hello %s,</h2>
            <p>Thank you for your interest in joining the Academy Platform.</p>
            
            <div class="highlight-box" style="border-left-color: #ef4444; background-color: #fef2f2;">
                <span class="badge-danger">Application Status: NOT APPROVED</span>
                <p style="margin: 10px 0 0 0; color: #991b1b;">After administrative review, we regret to inform you that your registration could not be approved at this time.</p>
            </div>

            <p>If you believe this was an error or would like further information, please reach out to your institution's administrator.</p>
            """.formatted(escape(userName));

        dispatchEmail(toEmail, subject, wrapWithAcademyTemplate(subject, "Academy account application status", body));
    }

    // =========================================================================
    // 2. Course & Enrollment Emails
    // =========================================================================

    /**
     * Notify teacher that a student requested enrollment in their course.
     */
    @Async
    public void sendEnrollmentRequestEmail(String teacherEmail, String teacherName, String studentName, String studentEmail, String courseTitle, String courseCode) {
        String subject = "Enrollment Request: " + courseCode + " - " + studentName;
        String body = """
            <h2>Hello %s,</h2>
            <p>A student has requested enrollment in your course.</p>
            
            <div class="highlight-box">
                <span class="badge-warning">Pending Request</span>
                <table class="meta-table" style="margin-top: 10px;">
                    <tr>
                        <td class="label">Course:</td>
                        <td class="value">%s (%s)</td>
                    </tr>
                    <tr>
                        <td class="label">Student Name:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Student Email:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/teacher/%s" class="btn">Review in Teacher Portal</a>
            </div>
            """.formatted(escape(teacherName), escape(courseTitle), escape(courseCode), escape(studentName), escape(studentEmail), escape(courseCode));

        dispatchEmail(teacherEmail, subject, wrapWithAcademyTemplate(subject, "New student enrollment request", body));
    }

    /**
     * Notify student of enrollment decision (approved or rejected).
     */
    @Async
    public void sendEnrollmentDecisionEmail(String studentEmail, String studentName, String courseTitle, String courseCode, boolean approved) {
        String subject = approved ? "Enrollment Approved: " + courseTitle : "Enrollment Update: " + courseTitle;
        String badge = approved ? "<span class=\"badge-success\">ENROLLED</span>" : "<span class=\"badge-danger\">NOT ENROLLED</span>";
        String message = approved 
            ? "Your request to join <strong>" + escape(courseTitle) + " (" + escape(courseCode) + ")</strong> has been approved! You now have access to assignments, course materials, and discussion forums."
            : "Your request to join <strong>" + escape(courseTitle) + " (" + escape(courseCode) + ")</strong> was not approved by the course instructor.";

        String body = """
            <h2>Hello %s,</h2>
            <div class="highlight-box">
                %s
                <p style="margin: 10px 0 0 0;">%s</p>
            </div>
            %s
            """.formatted(
                escape(studentName), 
                badge, 
                message,
                approved ? "<div style=\"text-align: center;\"><a href=\"http://localhost:3000/student/" + escape(courseCode) + "\" class=\"btn\">Go to Course</a></div>" : ""
            );

        dispatchEmail(studentEmail, subject, wrapWithAcademyTemplate(subject, "Enrollment status update", body));
    }

    /**
     * Notify teacher that they have been assigned to teach a course.
     */
    @Async
    public void sendTeacherCourseAssignmentEmail(String teacherEmail, String teacherName, String courseTitle, String courseCode) {
        String subject = "Course Assignment: " + courseCode + " - " + courseTitle;
        String body = """
            <h2>Hello %s,</h2>
            <p>You have been assigned as an instructor for the following course on the Academy Platform:</p>
            
            <div class="highlight-box" style="border-left-color: #3b82f6;">
                <table class="meta-table">
                    <tr>
                        <td class="label">Course Name:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Course Code:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/teacher/%s" class="btn">Open Course Management</a>
            </div>
            """.formatted(escape(teacherName), escape(courseTitle), escape(courseCode), escape(courseCode));

        dispatchEmail(teacherEmail, subject, wrapWithAcademyTemplate(subject, "New course teaching assignment", body));
    }

    // =========================================================================
    // 3. Assignment & Submission Emails
    // =========================================================================

    /**
     * Notify enrolled students that a new assignment was posted.
     */
    @Async
    public void sendNewAssignmentEmail(String studentEmail, String studentName, String courseTitle, String courseCode, String assignmentTitle, LocalDateTime dueDate, Integer maxMarks) {
        String subject = "New Assignment: " + assignmentTitle + " (" + courseCode + ")";
        String dueFormatted = dueDate != null ? dueDate.format(DATE_FORMATTER) : "Check platform for deadline";

        String body = """
            <h2>Hello %s,</h2>
            <p>A new assignment has been published for your course <strong>%s</strong>.</p>
            
            <div class="highlight-box">
                <table class="meta-table">
                    <tr>
                        <td class="label">Assignment:</td>
                        <td class="value"><strong>%s</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Course:</td>
                        <td class="value">%s (%s)</td>
                    </tr>
                    <tr>
                        <td class="label">Due Date:</td>
                        <td class="value" style="color: #dc2626;">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Total Marks:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/student/%s" class="btn">View Assignment & Submit</a>
            </div>
            """.formatted(escape(studentName), escape(courseTitle), escape(assignmentTitle), escape(courseTitle), escape(courseCode), dueFormatted, maxMarks != null ? maxMarks : 100, escape(courseCode));

        dispatchEmail(studentEmail, subject, wrapWithAcademyTemplate(subject, "New assignment posted: " + assignmentTitle, body));
    }

    /**
     * Send submission receipt to student.
     */
    @Async
    public void sendSubmissionConfirmationEmail(String studentEmail, String studentName, String assignmentTitle, String courseTitle, LocalDateTime submittedAt) {
        String subject = "Submission Confirmation: " + assignmentTitle;
        String timeFormatted = submittedAt != null ? submittedAt.format(DATE_FORMATTER) : LocalDateTime.now().format(DATE_FORMATTER);

        String body = """
            <h2>Hello %s,</h2>
            <p>Your submission for <strong>%s</strong> in <strong>%s</strong> has been successfully received.</p>
            
            <div class="highlight-box" style="border-left-color: #10b981; background-color: #f0fdf4;">
                <span class="badge-success">SUBMISSION CONFIRMED</span>
                <table class="meta-table" style="margin-top: 10px;">
                    <tr>
                        <td class="label">Assignment:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Course:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Timestamp:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>
            <p>Your instructor will review your work and assign a grade. You will receive an email once grades are published.</p>
            """.formatted(escape(studentName), escape(assignmentTitle), escape(courseTitle), escape(assignmentTitle), escape(courseTitle), timeFormatted);

        dispatchEmail(studentEmail, subject, wrapWithAcademyTemplate(subject, "Your submission was received", body));
    }

    /**
     * Alert course teacher that a student submitted an assignment.
     */
    @Async
    public void sendNewSubmissionTeacherAlert(String teacherEmail, String teacherName, String studentName, String assignmentTitle, String courseTitle, String courseCode) {
        String subject = "New Submission: " + studentName + " - " + assignmentTitle;
        String body = """
            <h2>Hello %s,</h2>
            <p>A student has submitted their work for an assignment in your course.</p>
            
            <div class="highlight-box">
                <table class="meta-table">
                    <tr>
                        <td class="label">Student:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Assignment:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Course:</td>
                        <td class="value">%s (%s)</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/teacher/%s" class="btn">Grade Submission</a>
            </div>
            """.formatted(escape(teacherName), escape(studentName), escape(assignmentTitle), escape(courseTitle), escape(courseCode), escape(courseCode));

        dispatchEmail(teacherEmail, subject, wrapWithAcademyTemplate(subject, "New student submission for " + assignmentTitle, body));
    }

    /**
     * Notify student that their assignment has been graded.
     */
    @Async
    public void sendGradeNotificationEmail(String studentEmail, String studentName, String assignmentTitle, String courseTitle, String courseCode, Number finalMark, Integer maxMarks, String feedback) {
        String subject = "Grade Published: " + assignmentTitle + " (" + courseTitle + ")";
        String feedbackHtml = (feedback != null && !feedback.trim().isEmpty()) 
            ? "<tr><td class=\"label\">Feedback:</td><td class=\"value\"><em>\"" + escape(feedback) + "\"</em></td></tr>"
            : "";

        String body = """
            <h2>Hello %s,</h2>
            <p>Your instructor has graded your submission for <strong>%s</strong> in <strong>%s</strong>.</p>
            
            <div class="highlight-box" style="border-left-color: #2563eb;">
                <table class="meta-table">
                    <tr>
                        <td class="label">Assignment:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Score:</td>
                        <td class="value" style="font-size: 18px; color: #2563eb;"><strong>%s / %s</strong></td>
                    </tr>
                    %s
                </table>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/student/%s" class="btn">View Grade Details</a>
            </div>
            """.formatted(escape(studentName), escape(assignmentTitle), escape(courseTitle), escape(assignmentTitle), finalMark != null ? finalMark : "-", maxMarks != null ? maxMarks : 100, feedbackHtml, escape(courseCode));

        dispatchEmail(studentEmail, subject, wrapWithAcademyTemplate(subject, "Your grade has been published", body));
    }

    // =========================================================================
    // 4. Announcements & Academic Integrity
    // =========================================================================

    /**
     * Notify enrolled students of a course announcement.
     */
    @Async
    public void sendCourseAnnouncementEmail(String studentEmail, String studentName, String courseTitle, String courseCode, String announcementTitle, String announcementContent, String teacherName) {
        String subject = "Announcement: " + announcementTitle + " (" + courseCode + ")";
        String body = """
            <h2>Hello %s,</h2>
            <p>Instructor <strong>%s</strong> has posted an announcement for <strong>%s</strong>.</p>
            
            <div class="highlight-box">
                <h3 style="margin-top: 0; color: #1e3a8a;">%s</h3>
                <p style="white-space: pre-line; margin-bottom: 0;">%s</p>
            </div>

            <div style="text-align: center;">
                <a href="http://localhost:3000/student/%s" class="btn">Open Course Forum</a>
            </div>
            """.formatted(escape(studentName), escape(teacherName), escape(courseTitle), escape(announcementTitle), escape(announcementContent), escape(courseCode));

        dispatchEmail(studentEmail, subject, wrapWithAcademyTemplate(subject, "New course announcement", body));
    }

    /**
     * Send plagiarism alert email to student or teacher.
     */
    @Async
    public void sendPlagiarismAlertEmail(String recipientEmail, String recipientName, String assignmentTitle, String courseTitle, double similarityPercentage, String details) {
        String subject = "Academic Integrity Alert: " + assignmentTitle;
        String body = """
            <h2>Notice: Academic Integrity Review</h2>
            <p>Dear %s,</p>
            <p>The automated code similarity detection system has flagged a submission in <strong>%s</strong> for <strong>%s</strong>.</p>
            
            <div class="highlight-box" style="border-left-color: #ef4444; background-color: #fef2f2;">
                <span class="badge-danger">FLAGGED FOR REVIEW</span>
                <table class="meta-table" style="margin-top: 10px;">
                    <tr>
                        <td class="label">Assignment:</td>
                        <td class="value">%s</td>
                    </tr>
                    <tr>
                        <td class="label">Similarity Score:</td>
                        <td class="value" style="color: #b91c1c; font-size: 16px;"><strong>%.1f%%</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Details:</td>
                        <td class="value">%s</td>
                    </tr>
                </table>
            </div>

            <p>Please review the forensic report on the Academy Platform or reach out to the course instructor.</p>
            """.formatted(escape(recipientName), escape(courseTitle), escape(assignmentTitle), escape(assignmentTitle), similarityPercentage, escape(details));

        dispatchEmail(recipientEmail, subject, wrapWithAcademyTemplate(subject, "Academic integrity alert", body));
    }

    /**
     * Test email sending capability to verify Gmail SMTP setup.
     */
    public boolean sendTestEmail(String toEmail) {
        String subject = "Academy Platform - Gmail SMTP Connection Test";
        String body = """
            <h2>SMTP Configuration Verified!</h2>
            <div class="highlight-box" style="border-left-color: #10b981; background-color: #f0fdf4;">
                <span class="badge-success">CONNECTION SUCCESSFUL</span>
                <p style="margin: 10px 0 0 0; color: #166534;">Your Gmail SMTP credentials are configured correctly. The Academy Platform can now send real notifications to all relevant users.</p>
            </div>
            <table class="meta-table">
                <tr>
                    <td class="label">Sender Email:</td>
                    <td class="value">%s</td>
                </tr>
                <tr>
                    <td class="label">Recipient Email:</td>
                    <td class="value">%s</td>
                </tr>
                <tr>
                    <td class="label">Timestamp:</td>
                    <td class="value">%s</td>
                </tr>
            </table>
            """.formatted(escape(fromEmail), escape(toEmail), LocalDateTime.now().format(DATE_FORMATTER));

        try {
            sendEmail(toEmail, subject, wrapWithAcademyTemplate(subject, "Gmail SMTP verified", body));
            log.info("Test email successfully dispatched to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send test email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    // =========================================================================
    // Internal Email Dispatcher & Templates
    // =========================================================================

    private void dispatchEmail(String toEmail, String subject, String htmlContent) {
        try {
            sendEmail(toEmail, subject, htmlContent);
            log.info("Email sent successfully to: [{}] Subject: '{}'", toEmail, subject);
        } catch (Exception e) {
            log.error("Failed to send email to [{}]: {}. Logging fallback notice.", toEmail, e.getMessage());
            logEmailFallback(toEmail, subject, "Failed to deliver via SMTP. Please verify SMTP_USERNAME and SMTP_PASSWORD in .env.");
        }
    }

    private void sendEmail(String toEmail, String subject, String htmlContent) throws Exception {
        // Fallback to console logging if credentials are default placeholders
        if (smtpUsername == null || smtpUsername.trim().isEmpty() || "your-email@gmail.com".equalsIgnoreCase(smtpUsername)) {
            log.warn("SMTP credentials not set (currently '{}'). Email to {} logged to console only.", smtpUsername, toEmail);
            logEmailFallback(toEmail, subject, "SMTP credentials not configured.");
            return;
        }

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        String effectiveFrom = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("noreply@academy.com"))
                ? fromEmail
                : smtpUsername;
        helper.setFrom(effectiveFrom, fromName);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);

        mailSender.send(message);
    }

    private void logEmailFallback(String toEmail, String subject, String message) {
        log.info("=== EMAIL NOTIFICATION (FALLBACK LOG) ===");
        log.info("TO:      {}", toEmail);
        log.info("FROM:    {} <{}>", fromName, fromEmail);
        log.info("SUBJECT: {}", subject);
        log.info("BODY:    {}", message);
        log.info("=========================================");
    }

    private String escape(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private String wrapWithAcademyTemplate(String title, String preheader, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
                <style>
                    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; }
                    .email-wrapper { width: 100%%; background-color: #f1f5f9; padding: 30px 15px; }
                    .email-card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
                    .email-header { background: linear-gradient(135deg, #1e40af 0%%, #2563eb 50%%, #0ea5e9 100%%); padding: 28px 24px; text-align: center; color: #ffffff; }
                    .email-header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.05em; color: #ffffff; }
                    .email-header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; color: #e0f2fe; text-transform: uppercase; letter-spacing: 0.1em; }
                    .email-body { padding: 32px 28px; color: #1e293b; line-height: 1.6; }
                    .email-body h2 { margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; }
                    .highlight-box { background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; padding: 16px; margin: 20px 0; }
                    .badge-success { display: inline-block; background-color: #dcfce7; color: #15803d; font-weight: 600; padding: 4px 10px; border-radius: 9999px; font-size: 12px; }
                    .badge-warning { display: inline-block; background-color: #fef9c3; color: #854d0e; font-weight: 600; padding: 4px 10px; border-radius: 9999px; font-size: 12px; }
                    .badge-danger { display: inline-block; background-color: #fee2e2; color: #b91c1c; font-weight: 600; padding: 4px 10px; border-radius: 9999px; font-size: 12px; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 20px 0 10px 0; text-align: center; }
                    .meta-table { width: 100%%; border-collapse: collapse; margin: 15px 0; }
                    .meta-table td { padding: 8px 0; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
                    .meta-table td.label { color: #64748b; width: 35%%; font-weight: 500; }
                    .meta-table td.value { color: #0f172a; font-weight: 600; }
                    .email-footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
                </style>
            </head>
            <body>
                <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">%s</div>
                <div class="email-wrapper">
                    <div class="email-card">
                        <div class="email-header">
                            <h1>ACADEMY</h1>
                            <p>Learning Management Platform</p>
                        </div>
                        <div class="email-body">
                            %s
                        </div>
                        <div class="email-footer">
                            <p style="margin: 0 0 6px 0;">© 2026 Academy LMS. All rights reserved.</p>
                            <p style="margin: 0; color: #94a3b8;">This is an automated notification. Please do not reply directly to this email.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(title, preheader, bodyContent);
    }
}
