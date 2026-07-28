package com.yakusabor.backend.security;

import java.util.Arrays;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    // Roles admin cubriendo las variantes de mayúsculas/minúsculas que puedan
    // venir de la BD ('Administrador', 'ADMINISTRADOR', 'administrador').
    private static final String[] ROLES_ADMIN = { "ADMINISTRADOR", "Administrador", "administrador" };

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // ── Público (sin token) ──
                        .requestMatchers("/api/auth/login", "/api/auth/registro").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()

                        // ── Mesas: lectura pública (el cliente necesita verlas al pedir) ──
                        .requestMatchers(HttpMethod.GET, "/api/mesas/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/mesas/**")
                        .hasAnyRole("MESERO", "Mesero", "mesero", "ADMINISTRADOR", "Administrador", "administrador")
                        .requestMatchers(HttpMethod.PUT, "/api/mesas/**")
                        .hasAnyRole("MESERO", "Mesero", "mesero", "ADMINISTRADOR", "Administrador", "administrador")
                        .requestMatchers(HttpMethod.DELETE, "/api/mesas/**").hasAnyRole(ROLES_ADMIN)

                        // ── Pedidos ──
                        .requestMatchers(HttpMethod.POST, "/api/pedidos/**")
                        .hasAnyRole("MESERO", "Mesero", "mesero", "ADMINISTRADOR", "Administrador", "administrador", "CLIENTE", "Cliente", "cliente")
                        .requestMatchers(HttpMethod.GET, "/api/pedidos/**")
                        .hasAnyRole("MESERO", "Mesero", "mesero", "ADMINISTRADOR", "Administrador", "administrador", "COCINERO", "Cocinero", "cocinero")
                        .requestMatchers(HttpMethod.PUT, "/api/pedidos/*/detalles/*/estado")
                        .hasAnyRole("COCINERO", "Cocinero", "cocinero", "ADMINISTRADOR", "Administrador", "administrador")

                        // ── Productos ──
                        .requestMatchers(HttpMethod.POST, "/api/productos/**")
                        .hasAnyRole("ADMINISTRADOR", "Administrador", "administrador", "COCINERO", "Cocinero", "cocinero")
                        .requestMatchers(HttpMethod.PUT, "/api/productos/**")
                        .hasAnyRole("ADMINISTRADOR", "Administrador", "administrador", "COCINERO", "Cocinero", "cocinero")
                        .requestMatchers(HttpMethod.DELETE, "/api/productos/**").hasAnyRole(ROLES_ADMIN)

                        // ── Mozos ──
                        .requestMatchers("/api/usuarios/meseros/**").hasAnyRole(ROLES_ADMIN)

                        // ── Tareas asignadas a mozos ──
                        .requestMatchers(HttpMethod.POST, "/api/tareas").hasAnyRole(ROLES_ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/tareas/mesero/**").hasAnyRole(ROLES_ADMIN)
                        .requestMatchers("/api/tareas/**").authenticated()

                        // ── Resto ──
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "https://localhost:*",
                "https://127.0.0.1:*",
                "https://*.app.github.dev",
                "https://*.githubpreview.dev"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}