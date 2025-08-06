package com.example.demo.repository;

import com.example.demo.model.User;
import com.example.demo.model.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByIsApprovedFalseOrderByCreatedAtDesc();
    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);
    List<User> findByStatus(UserStatus status);
}
