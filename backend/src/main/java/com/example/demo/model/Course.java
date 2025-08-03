package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String courseCode;   // e.g., CS101
    private String title;        // e.g., Data Structures
    private String description;  // Course description
    
    @ManyToOne
    private User assignedTeacher;  // One teacher per course
}
