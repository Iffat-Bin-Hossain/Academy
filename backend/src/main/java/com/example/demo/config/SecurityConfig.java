package com.example.demo.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
            // 1) CORS using your existing config
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 2) Disable CSRF (we’re stateless)
            .csrf(csrf -> csrf.disable())
            // 3) No HTTP session; we use JWT only
            .sessionManagement(sm -> sm
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // 4) Route protection
            .authorizeHttpRequests(auth -> auth
                // public signup & login
                .requestMatchers("/api/auth/**", "/api/test").permitAll()
                // admin-only endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // everything else requires authentication
                .anyRequest().authenticated()
            )
            // 5) Inject our JWT validation filter
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // adjust origins as needed
        config.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:8080"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // apply to all paths
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
