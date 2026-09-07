package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlagiarismBaselineRequest {
    private String filename;
    private String codeContent;
    private String language;
}
