package com.example.demo.config;

import com.example.demo.model.Role;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    // In a real app put this in env vars!
    private final Key key = Keys.hmacShaKeyFor("MySuperSecretKeyMySuperSecretKey".getBytes());
    private final long EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24h

    /** Generate a token containing email, role, userId. */
    public String generateToken(Long userId, String email, Role role) {
        return Jwts.builder()
            .setSubject(email)
            .claim("userId", userId)
            .claim("role", role.name())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
            .signWith(key, SignatureAlgorithm.HS256)
            .compact();
    }

    /** Parse and validate token; throws if invalid/expired. */
    public Jws<Claims> validateToken(String token) {
        return Jwts.parserBuilder()
                   .setSigningKey(key)
                   .build()
                   .parseClaimsJws(token);
    }
}
