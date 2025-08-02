package com.example.demo.config;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create admin user if not exists
        if (userRepository.findByEmail("admin@academy.com").isEmpty()) {
            User admin = User.builder()
                    .name("System Admin")
                    .email("admin@academy.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .isApproved(true)
                    .build();
            
            userRepository.save(admin);
            log.info("===============================");
            log.info("Default admin user created:");
            log.info("Email: admin@academy.com");
            log.info("Password: admin123");
            log.info("===============================");
        }
    }
}
