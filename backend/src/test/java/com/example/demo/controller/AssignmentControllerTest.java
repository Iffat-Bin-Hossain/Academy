package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.AssignmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test class for Assignment-related endpoints
 * This is for testing purposes - not part of the actual application
 */
@WebMvcTest(AssignmentController.class)
public class AssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AssignmentService assignmentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "TEACHER")
    public void testCreateAssignment() throws Exception {
        // Arrange
        AssignmentCreateRequest request = new AssignmentCreateRequest();
        request.setTitle("Test Assignment");
        request.setContent("This is a test assignment");
        request.setMaxMarks(100);
        request.setCourseId(1L);
        request.setDeadline(LocalDateTime.now().plusDays(7));
        request.setAssignmentType(AssignmentType.HOMEWORK);

        AssignmentResponse expectedResponse = AssignmentResponse.builder()
                .id(1L)
                .title("Test Assignment")
                .content("This is a test assignment")
                .maxMarks(100)
                .courseId(1L)
                .courseTitle("Test Course")
                .courseCode("CS101")
                .createdById(1L)
                .createdByName("Test Teacher")
                .deadline(request.getDeadline())
                .assignmentType(AssignmentType.HOMEWORK)
                .isActive(true)
                .isOverdue(false)
                .canSubmitLate(false)
                .build();

        when(assignmentService.createAssignment(any(AssignmentCreateRequest.class), anyLong()))
                .thenReturn(expectedResponse);

        // Act & Assert
        mockMvc.perform(post("/api/assignments")
                        .param("teacherId", "1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test Assignment"))
                .andExpect(jsonPath("$.maxMarks").value(100))
                .andExpect(jsonPath("$.courseId").value(1));
    }

    @Test
    @WithMockUser(roles = "TEACHER")
    public void testGetAssignmentsForCourse() throws Exception {
        // Arrange
        List<AssignmentResponse> expectedAssignments = Arrays.asList(
                AssignmentResponse.builder()
                        .id(1L)
                        .title("Assignment 1")
                        .maxMarks(100)
                        .courseId(1L)
                        .courseTitle("Test Course")
                        .courseCode("CS101")
                        .createdById(1L)
                        .createdByName("Test Teacher")
                        .assignmentType(AssignmentType.HOMEWORK)
                        .isActive(true)
                        .isOverdue(false)
                        .canSubmitLate(false)
                        .build(),
                AssignmentResponse.builder()
                        .id(2L)
                        .title("Assignment 2")
                        .maxMarks(150)
                        .courseId(1L)
                        .courseTitle("Test Course")
                        .courseCode("CS101")
                        .createdById(1L)
                        .createdByName("Test Teacher")
                        .assignmentType(AssignmentType.PROJECT)
                        .isActive(true)
                        .isOverdue(false)
                        .canSubmitLate(false)
                        .build()
        );

        when(assignmentService.getAssignmentsForCourse(1L)).thenReturn(expectedAssignments);

        // Act & Assert
        mockMvc.perform(get("/api/assignments/course/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Assignment 1"))
                .andExpect(jsonPath("$[1].title").value("Assignment 2"));
    }
}
