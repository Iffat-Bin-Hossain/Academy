package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Course course;

    @ManyToOne
    private User student;

    @Enumerated(EnumType.STRING)
    private EnrollmentStatus status; // PENDING, APPROVED, REJECTED

    @ManyToOne
    private User actionBy; // who approved/rejected
}
