// MesaService.java
package com.yakusabor.backend.services;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.dto.MesaEstadoResponse;
import com.yakusabor.backend.models.Mesa;
import com.yakusabor.backend.models.Pedido;
import com.yakusabor.backend.repositories.MesaRepository;
import com.yakusabor.backend.repositories.PedidoRepository;

@Service
public class MesaService {

    private static final List<String> ESTADOS_VALIDOS =
            List.of("libre", "ocupada", "reservada", "fuera_servicio");
    private static final List<String> ESTADOS_PEDIDO_ABIERTOS =
            List.of("nuevo", "en_preparacion", "listo", "entregado");

    @Autowired private MesaRepository mesaRepository;
    @Autowired private PedidoRepository pedidoRepository;

    public List<MesaEstadoResponse> obtenerEstadoMesas() {
        return mesaRepository.findAll().stream()
                .sorted(Comparator.comparing(Mesa::getId))
                .map(this::toResponse)
                .toList();
    }

    public MesaEstadoResponse crearMesa(Map<String, String> body) {
        String codigo = body.getOrDefault("codigo", "").trim();
        String ubicacion = body.getOrDefault("ubicacion", "interior").trim();

        if (codigo.isEmpty()) {
            throw new IllegalArgumentException("El campo 'codigo' es obligatorio.");
        }

        boolean existe = mesaRepository.findAll().stream()
                .anyMatch(m -> m.getCodigo().equalsIgnoreCase(codigo));
        if (existe) {
            throw new IllegalArgumentException("Ya existe una mesa con el código: " + codigo);
        }

        Mesa nueva = new Mesa();
        nueva.setCodigo(codigo.toUpperCase());
        nueva.setUbicacion(ubicacion.toLowerCase());
        nueva.setEstado("libre");

        return toResponse(mesaRepository.save(nueva));
    }

    public MesaEstadoResponse actualizarEstado(Integer id, Map<String, String> body) {
        Mesa mesa = mesaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada."));

        String nuevoEstado = body.getOrDefault("estado", "").trim().toLowerCase();
        if (!ESTADOS_VALIDOS.contains(nuevoEstado)) {
            throw new IllegalArgumentException("Estado inválido. Permitidos: " + ESTADOS_VALIDOS);
        }

        if ("libre".equals(nuevoEstado)) {
            List<Pedido> pedidosAbiertos = pedidoRepository.findByMesa_Id(id).stream()
                    .filter(p -> ESTADOS_PEDIDO_ABIERTOS.contains(p.getEstado()))
                    .toList();

            pedidosAbiertos.forEach(p -> {
                p.setEstado("cancelado");
                pedidoRepository.save(p);
            });
        }

        mesa.setEstado(nuevoEstado);
        return toResponse(mesaRepository.save(mesa));
    }

    public void eliminarMesa(Integer id) {
        if (!mesaRepository.existsById(id)) {
            throw new IllegalArgumentException("Mesa no encontrada.");
        }
        mesaRepository.deleteById(id);
    }

    private MesaEstadoResponse toResponse(Mesa mesa) {
        return new MesaEstadoResponse(
                mesa.getId(), mesa.getCodigo(), mesa.getUbicacion(),
                mesa.getEstado(), "libre".equalsIgnoreCase(mesa.getEstado()));
    }
}