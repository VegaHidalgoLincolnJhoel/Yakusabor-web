// UsuarioService.java
package com.yakusabor.backend.services;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.models.Rol;
import com.yakusabor.backend.models.Usuario;
import com.yakusabor.backend.repositories.PedidoRepository;
import com.yakusabor.backend.repositories.RolRepository;
import com.yakusabor.backend.repositories.UsuarioRepository;

@Service
public class UsuarioService {

    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private RolRepository rolRepository;
    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private static final List<String> TURNOS_VALIDOS = List.of("Mañana", "Tarde", "Noche");

    public List<Map<String, Object>> listarMeseros() {
        Optional<Rol> rolOpt = rolRepository.findByNombre("Mesero");
        if (rolOpt.isEmpty()) return List.of();
        Rol rolMesero = rolOpt.get();

        List<Usuario> meseros = usuarioRepository.findAll().stream()
                .filter(u -> u.getRol() != null && u.getRol().getId().equals(rolMesero.getId()))
                .collect(Collectors.toList());

        var pedidos = pedidoRepository.findAll();

        return meseros.stream().map(m -> {
            var pedidosMesero = pedidos.stream()
                    .filter(p -> p.getMesero() != null && p.getMesero().getId().equals(m.getId())
                            && !"cancelado".equalsIgnoreCase(p.getEstado()))
                    .collect(Collectors.toList());

            var hoy = java.time.LocalDate.now();
            double ventasHoy = pedidosMesero.stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().equals(hoy))
                    .mapToDouble(p -> p.getTotal() != null ? p.getTotal().doubleValue() : 0)
                    .sum();

            long mesasHoy = pedidosMesero.stream()
                    .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().equals(hoy) && p.getMesa() != null)
                    .map(p -> p.getMesa().getId())
                    .distinct()
                    .count();

            double totalGeneral = pedidosMesero.stream()
                    .mapToDouble(p -> p.getTotal() != null ? p.getTotal().doubleValue() : 0)
                    .sum();
            double promedio = pedidosMesero.isEmpty() ? 0 : totalGeneral / pedidosMesero.size();

            return Map.<String, Object>of(
                    "id", m.getId(), "nombre", m.getNombre(), "email", m.getEmail(),
                    "activo", m.getActivo() != null ? m.getActivo() : true,
                    "turno", m.getTurno() != null ? m.getTurno() : "Tarde",
                    "ventasDia", ventasHoy, "mesas", (int) mesasHoy, "promedio", promedio
            );
        }).collect(Collectors.toList());
    }

    public Map<String, Object> crearMesero(Map<String, String> body) {
        String nombre = body.getOrDefault("nombre", "").trim();
        String email = body.getOrDefault("email", "").trim();
        String password = body.getOrDefault("password", "").trim();
        String turno = body.getOrDefault("turno", "Tarde").trim();

        if (nombre.isEmpty()) throw new IllegalArgumentException("El nombre es obligatorio.");
        if (email.isEmpty()) throw new IllegalArgumentException("El correo es obligatorio.");
        if (password.isEmpty()) throw new IllegalArgumentException("La contraseña es obligatoria.");
        if (usuarioRepository.existsByEmail(email)) throw new IllegalArgumentException("El correo ya está en uso.");
        if (!TURNOS_VALIDOS.contains(turno)) turno = "Tarde";

        Rol rolMesero = rolRepository.findByNombre("Mesero")
                .orElseThrow(() -> new IllegalStateException("El rol 'Mesero' no existe en la base de datos."));

        Usuario nuevo = new Usuario();
        nuevo.setNombre(nombre);
        nuevo.setEmail(email);
        nuevo.setPassword(passwordEncoder.encode(password));
        nuevo.setRol(rolMesero);
        nuevo.setActivo(true);
        nuevo.setTurno(turno);

        Usuario guardado = usuarioRepository.save(nuevo);

        return Map.of("id", guardado.getId(), "nombre", guardado.getNombre(), "email", guardado.getEmail(),
                "activo", true, "turno", guardado.getTurno(), "ventasDia", 0, "mesas", 0, "promedio", 0);
    }

    public void eliminarMesero(Integer id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));

        String rolNombre = u.getRol() != null ? u.getRol().getNombre() : "";
        if (!"Mesero".equalsIgnoreCase(rolNombre)) {
            throw new IllegalArgumentException("Solo se pueden eliminar usuarios con rol Mesero.");
        }

        pedidoRepository.findAll().stream()
                .filter(p -> p.getMesero() != null && p.getMesero().getId().equals(id))
                .forEach(p -> { p.setMesero(null); pedidoRepository.save(p); });

        usuarioRepository.deleteById(id);
    }

    public Usuario toggleActivo(Integer id, Boolean activo) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado."));
        if (activo == null) throw new IllegalArgumentException("Falta el campo 'activo'.");
        u.setActivo(activo);
        return usuarioRepository.save(u);
    }
}