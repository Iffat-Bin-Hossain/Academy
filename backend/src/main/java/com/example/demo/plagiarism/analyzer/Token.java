package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Token {
    private TokenType type;
    private String value;
    private String normalizedValue;
    private int line;
    private int column;

    public enum TokenType {
        KEYWORD,
        IDENTIFIER,
        LITERAL_NUMBER,
        LITERAL_STRING,
        LITERAL_BOOLEAN,
        OPERATOR,
        DELIMITER,
        TYPE,
        SPECIAL
    }
}
