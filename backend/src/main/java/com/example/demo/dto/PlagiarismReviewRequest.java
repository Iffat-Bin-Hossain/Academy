package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismReviewRequest {
    private String decision; // CONFIRMED_PLAGIARISM, FALSE_POSITIVE, NEEDS_INVESTIGATION, CLEARED
    private Double penaltyPercentage;
    private String notes;
}
