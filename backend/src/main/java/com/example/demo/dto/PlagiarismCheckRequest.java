package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class PlagiarismCheckRequest {
    private Settings settings;
    private Long teacherId;

    @Data
    public static class Settings {
        private int threshold = 70;
        private boolean useAI = false;
        private List<String> fileFilters = List.of("cpp", "c", "h", "java", "py", "js", "ts", "kt", "sh", "txt");
        private boolean fastSimilarityOnly = true;
    }
}
