package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTagResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
}
