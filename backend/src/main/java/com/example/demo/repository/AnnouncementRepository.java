package com.example.demo.repository;

import com.example.demo.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    
    @Query("SELECT a FROM Announcement a LEFT JOIN FETCH a.createdBy WHERE a.course.id = :courseId ORDER BY a.createdAt DESC")
    List<Announcement> findByCourseIdOrderByCreatedAtDesc(@Param("courseId") Long courseId);
    
    @Query("SELECT a FROM Announcement a LEFT JOIN FETCH a.createdBy WHERE a.course.id = :courseId AND a.type = :type ORDER BY a.createdAt DESC")
    List<Announcement> findByCourseIdAndTypeOrderByCreatedAtDesc(@Param("courseId") Long courseId, @Param("type") Announcement.AnnouncementType type);
}
