package com.example.demo.model;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkAssessmentUpdateRequest {
    private List<AssessmentGridUpdateRequest> assessments;
}
