package com.yakusabor.backend.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yakusabor.backend.models.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {
    // Este método es clave para el LOGIN (buscar si existe el email)
    Optional<Usuario> findByEmail(String email);
    
    // Este método es clave para el REGISTRO (saber si el correo ya está en uso)
    boolean existsByEmail(String email);
}