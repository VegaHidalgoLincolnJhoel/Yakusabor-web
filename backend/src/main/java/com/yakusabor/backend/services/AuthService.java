// AuthService.java
package com.yakusabor.backend.services;

import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.dto.AuthResponse;
import com.yakusabor.backend.dto.LoginRequest;
import com.yakusabor.backend.dto.RegistroRequest;
import com.yakusabor.backend.models.Rol;
import com.yakusabor.backend.models.Usuario;
import com.yakusabor.backend.repositories.RolRepository;
import com.yakusabor.backend.repositories.UsuarioRepository;
import com.yakusabor.backend.security.JwtUtil;

@Service
public class AuthService {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Credenciales incorrectas"));

        if (!passwordEncoder.matches(request.getPassword(), usuario.getPassword())) {
            throw new IllegalArgumentException("Credenciales incorrectas");
        }

        String rolNombre = usuario.getRol().getNombre();
        String token = jwtUtil.generarToken(usuario.getEmail(), rolNombre);
        return new AuthResponse(token, usuario.getNombre(), rolNombre);
    }

    public Usuario obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    public void registrar(RegistroRequest request) {
        if (usuarioRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("El correo ya está en uso");
        }

        Rol rolCliente = rolRepository.findByNombre("Cliente")
                .orElseThrow(() -> new IllegalStateException("Error de configuración de roles en DB"));

        Usuario nuevo = new Usuario();
        nuevo.setNombre(request.getNombre());
        nuevo.setEmail(request.getEmail());
        nuevo.setPassword(passwordEncoder.encode(request.getPassword()));
        nuevo.setRol(rolCliente);

        usuarioRepository.save(nuevo);
    }
}