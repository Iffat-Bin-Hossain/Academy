package com.example.demo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.*;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Enable CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // 2. Disable CSRF because we're stateless (using JWT)
            .csrf(csrf -> csrf.disable())

            // 3. Stateless session management
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. Authorize requests by roles
            .authorizeHttpRequests(auth -> auth

                // 4.1 Public endpoints
                .requestMatchers("/api/auth/**", "/api/test").permitAll()

                // 4.2 Admin-only
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/courses/assign").hasRole("ADMIN")
                .requestMatchers("/api/courses/remove-teacher").hasRole("ADMIN")
                
                // Multiple teachers management - Admin only
                .requestMatchers("/api/courses/add-teacher").hasRole("ADMIN")
                .requestMatchers("/api/courses/remove-teacher-by-id").hasRole("ADMIN")
                .requestMatchers("/api/courses/update-teacher-role").hasRole("ADMIN")
                .requestMatchers("/api/courses/*/teachers").hasRole("ADMIN")
                
                // Course CRUD - Admin only for create/update/delete
                .requestMatchers(HttpMethod.POST, "/api/courses").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/courses/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/courses/*").hasRole("ADMIN")
                
                // Course viewing - Allow all authenticated users
                .requestMatchers(HttpMethod.GET, "/api/courses").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/courses/*").authenticated()

                // 4.3 Student-only
                .requestMatchers("/api/courses/enroll").hasRole("STUDENT")
                .requestMatchers("/api/courses/student/**").hasRole("STUDENT")

                // 4.4 Teacher-only
                .requestMatchers("/api/courses/teacher/**").hasRole("TEACHER")
                .requestMatchers("/api/courses/decide").hasRole("TEACHER")
                .requestMatchers("/api/courses/*/pending").hasRole("TEACHER")

                // 4.5 Assignment endpoints
                // Teachers can create, update, delete their own assignments
                .requestMatchers(HttpMethod.POST, "/api/assignments").hasRole("TEACHER")
                .requestMatchers(HttpMethod.PUT, "/api/assignments/*").hasRole("TEACHER")
                .requestMatchers(HttpMethod.DELETE, "/api/assignments/*").hasRole("TEACHER")
                .requestMatchers("/api/assignments/teacher/**").hasRole("TEACHER")
                
                // Students and teachers can view assignments
                .requestMatchers(HttpMethod.GET, "/api/assignments/**").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/courses/*/assignments").authenticated()

                // 4.7 Notification endpoints - all authenticated users
                .requestMatchers("/api/notifications/**").authenticated()

                // 4.8 Any other route requires authentication
                .anyRequest().authenticated()
            )

            // 5. Add our JWT filter *before* UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Configure allowed CORS origins and methods.
     * This allows frontend (localhost:3000) to access your backend (8080).
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:3000", // React frontend
            "http://localhost:8080"  // Optional (for Swagger or direct backend access)
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
