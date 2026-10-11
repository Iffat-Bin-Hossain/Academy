package com.example.demo.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now().toString());
        health.put("service", "Academy Backend");

        // Test database connectivity
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                if (conn.isValid(2)) {
                    health.put("database", "CONNECTED");
                    health.put("dbProduct", conn.getMetaData().getDatabaseProductName());
                } else {
                    health.put("database", "DOWN");
                }
            } catch (Exception e) {
                health.put("database", "ERROR: " + e.getMessage());
            }
        } else {
            health.put("database", "NO_DATASOURCE");
        }

        return ResponseEntity.ok(health);
    }
}
