package com.example.demo.model;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
}
