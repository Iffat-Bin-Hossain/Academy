package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenStream {
    private List<Token> tokens = new ArrayList<>();

    public void add(Token token) {
        this.tokens.add(token);
    }

    public int size() {
        return tokens.size();
    }

    public String toNormalizedSequence() {
        StringBuilder sb = new StringBuilder();
        for (Token t : tokens) {
            sb.append(t.getNormalizedValue() != null ? t.getNormalizedValue() : t.getValue()).append(" ");
        }
        return sb.toString().trim();
    }
}
