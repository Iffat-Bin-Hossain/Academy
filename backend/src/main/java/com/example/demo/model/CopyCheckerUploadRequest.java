package com.example.demo.model;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopyCheckerUploadRequest {
    private Long assignmentId;
    private String fileName;
    private List<String> flaggedStudentEmails; // Emails of students flagged for copying
}
