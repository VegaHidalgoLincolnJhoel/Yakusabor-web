package com.yakusabor.backend.services;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.dto.PedidoDashboardResponse;
import com.yakusabor.backend.dto.PedidoDetalleResponse;
import com.yakusabor.backend.dto.PedidoResponse;
import com.yakusabor.backend.models.Mesa;
import com.yakusabor.backend.models.Pedido;
import com.yakusabor.backend.models.PedidoDetalle;
import com.yakusabor.backend.models.Producto;
import com.yakusabor.backend.models.Usuario;
import com.yakusabor.backend.repositories.MesaRepository;
import com.yakusabor.backend.repositories.PedidoRepository;
import com.yakusabor.backend.repositories.ProductoRepository;
import com.yakusabor.backend.repositories.UsuarioRepository;
import com.yakusabor.backend.dto.CuentaMesaResponse;

@Service
public class PedidoService {

private static final List<String> ESTADOS_DETALLE =
            List.of("pendiente", "en_preparacion", "listo", "entregado", "rechazado");
    private static final List<String> ESTADOS_PEDIDO =
            List.of("nuevo", "en_preparacion", "listo", "entregado", "facturado", "cancelado");
private static final List<String> ESTADOS_FACTURABLES = 
            List.of("nuevo", "en_preparacion", "listo", "entregado");

    @Autowired private PedidoRepository pedidoRepository;
    @Autowired private ProductoRepository productoRepository;
    @Autowired private MesaRepository mesaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    public List<PedidoDashboardResponse> listarPedidos() {
        return pedidoRepository.findAll().stream()
                .sorted(Comparator.comparing(Pedido::getCreatedAt).reversed())
                .map(this::mapPedidoDashboard)
                .toList();
    }

    public PedidoResponse crearPedido(Map<String, Object> request) {
        List<Map<String, Object>> items = getItems(request);
        if (items.isEmpty()) {
            throw new IllegalArgumentException("El pedido debe tener al menos un producto.");
        }

        String tipo = normalizarTipo(getString(request, "tipoPedido", "tipo_pedido", "tipo"));
        Pedido pedido = new Pedido();
        pedido.setTipo(tipo);
        pedido.setEstado("nuevo");

        if ("presencial".equals(tipo)) {
            Integer mesaId = getInteger(request, "mesaId", "mesa_id");
            if (mesaId == null) {
                throw new IllegalArgumentException("Debes seleccionar una mesa para pedidos presenciales.");
            }
            Mesa mesa = mesaRepository.findById(mesaId)
                    .orElseThrow(() -> new IllegalArgumentException("La mesa seleccionada no existe."));
            mesa.setEstado("ocupada");
            mesaRepository.save(mesa);
            pedido.setMesa(mesa);
        } else {
            String direccion = getString(request, "direccion", "direccionDelivery", "direccion_delivery");
            if (direccion.isEmpty()) {
                throw new IllegalArgumentException("Debes ingresar una dirección para delivery.");
            }
            pedido.setDireccionDelivery(direccion);
        }

        Integer meseroId = getInteger(request, "meseroId", "mesero_id");
        if (meseroId != null) {
            Usuario mesero = usuarioRepository.findById(meseroId)
                    .orElseThrow(() -> new IllegalArgumentException("El mesero seleccionado no existe."));
            pedido.setMesero(mesero);
        }

        BigDecimal totalCalculado = BigDecimal.ZERO;
        for (Map<String, Object> itemRequest : items) {
            Integer productoId = getInteger(itemRequest, "productoId", "producto_id");
            if (productoId == null) {
                throw new IllegalArgumentException("Cada detalle debe incluir un producto.");
            }

            Integer cantidadValue = getInteger(itemRequest, "cantidad");
            int cantidad = cantidadValue == null ? 1 : cantidadValue;
            if (cantidad <= 0) {
                throw new IllegalArgumentException("La cantidad debe ser mayor que cero.");
            }

            Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productoId));

            if (!Boolean.TRUE.equals(producto.getDisponible())) {
                throw new IllegalArgumentException("El producto no está disponible: " + producto.getNombre());
            }

            BigDecimal precioUnitario = getBigDecimal(itemRequest, "precioUnitario", "precio_unitario");
            precioUnitario = precioUnitario != null ? precioUnitario : BigDecimal.valueOf(producto.getPrecio());

            PedidoDetalle detalle = new PedidoDetalle();
            detalle.setProducto(producto);
            detalle.setCantidad(cantidad);
            detalle.setPrecioUnitario(precioUnitario);
            detalle.setNotas(getString(itemRequest, "notas"));
            pedido.agregarDetalle(detalle);

            totalCalculado = totalCalculado.add(precioUnitario.multiply(BigDecimal.valueOf(cantidad)));
        }

        pedido.setTotal(totalCalculado);
        Pedido guardado = pedidoRepository.save(pedido);

        return new PedidoResponse(guardado.getId(), guardado.getTipo(), guardado.getEstado(),
                guardado.getTotal(), guardado.getCreatedAt(), "Pedido registrado correctamente.");
    }

    public PedidoDashboardResponse actualizarEstado(Integer id, String estadoSolicitado) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("El pedido seleccionado no existe."));

        String nuevoEstado = normalizarEstado(estadoSolicitado);
        pedido.setEstado(nuevoEstado);

        if (pedido.getMesa() != null
                && ("entregado".equals(nuevoEstado) || "cancelado".equals(nuevoEstado) || "facturado".equals(nuevoEstado))) {
            pedido.getMesa().setEstado("libre");
        }

        return mapPedidoDashboard(pedidoRepository.save(pedido));
    }

    public Map<String, Object> actualizarEstadoDetalle(Integer pedidoId, Integer detalleId, String estadoSolicitado) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado."));

        PedidoDetalle detalle = pedido.getDetalles().stream()
                .filter(d -> d.getId().equals(detalleId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Detalle no encontrado."));

        String nuevoEstado = estadoSolicitado.trim().toLowerCase();
        if (!ESTADOS_DETALLE.contains(nuevoEstado)) {
            throw new IllegalArgumentException("Estado inválido.");
        }

        detalle.setEstadoDetalle(nuevoEstado);
        pedidoRepository.save(pedido);

        return Map.of("mensaje", "Estado actualizado", "detalleId", detalleId, "estado", nuevoEstado);
    }

    public CuentaMesaResponse obtenerCuentaMesa(Integer mesaId) {
    Mesa mesa = mesaRepository.findById(mesaId)
            .orElseThrow(() -> new IllegalArgumentException("Mesa no encontrada."));

    List<Pedido> activos = pedidoRepository.findByMesa_Id(mesaId).stream()
            .filter(p -> ESTADOS_FACTURABLES.contains(p.getEstado()))
            .toList();

    if (activos.isEmpty()) {
        throw new IllegalArgumentException("La mesa no tiene pedidos pendientes de cobro.");
    }

        BigDecimal total = activos.stream()
            .map(p -> p.getTotal() == null ? BigDecimal.ZERO : p.getTotal())
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    List<PedidoDashboardResponse> pedidosDto = activos.stream()
            .map(this::mapPedidoDashboard)
            .toList();

    return new CuentaMesaResponse(mesa.getId(), mesa.getCodigo(), total, pedidosDto);
}

public CuentaMesaResponse generarFactura(Integer mesaId) {
    CuentaMesaResponse cuenta = obtenerCuentaMesa(mesaId); // valida y trae todo

    List<Pedido> activos = pedidoRepository.findByMesa_Id(mesaId).stream()
            .filter(p -> ESTADOS_FACTURABLES.contains(p.getEstado()))
            .toList();

    activos.forEach(p -> {
        p.setEstado("facturado");
        pedidoRepository.save(p);
    });

    Mesa mesa = mesaRepository.findById(mesaId).orElseThrow();
    mesa.setEstado("libre");
    mesaRepository.save(mesa);

    return cuenta; // devuelve el detalle ya facturado, para imprimir
}
    // ── Helpers ──
    private String normalizarTipo(String tipoPedido) {
        String tipo = tipoPedido == null ? "presencial" : tipoPedido.trim().toLowerCase();
        if (!"presencial".equals(tipo) && !"delivery".equals(tipo)) {
            throw new IllegalArgumentException("Tipo de pedido inválido.");
        }
        return tipo;
    }

    private String normalizarEstado(String estadoPedido) {
        String estado = estadoPedido == null ? "" : estadoPedido.trim().toLowerCase();
        if (!ESTADOS_PEDIDO.contains(estado)) {
            throw new IllegalArgumentException("Estado de pedido inválido.");
        }
        return estado;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> getItems(Map<String, Object> request) {
        Object value = request.get("items");
        return value instanceof List<?> ? (List<Map<String, Object>>) value : Collections.emptyList();
    }

    private String getString(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value != null) return String.valueOf(value).trim();
        }
        return "";
    }

    private Integer getInteger(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof Number number) return number.intValue();
            if (value != null && !String.valueOf(value).trim().isEmpty()) return Integer.parseInt(String.valueOf(value).trim());
        }
        return null;
    }

    private BigDecimal getBigDecimal(Map<String, Object> source, String... keys) {
        for (String key : keys) {
            Object value = source.get(key);
            if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
            if (value != null && !String.valueOf(value).trim().isEmpty()) return new BigDecimal(String.valueOf(value).trim());
        }
        return null;
    }

    private PedidoDashboardResponse mapPedidoDashboard(Pedido pedido) {
        List<PedidoDetalleResponse> detalles = pedido.getDetalles().stream()
                .map(d -> new PedidoDetalleResponse(
                        d.getProducto().getId(), d.getProducto().getNombre(), d.getCantidad(),
                        d.getPrecioUnitario(), d.getNotas(), d.getId(), d.getEstadoDetalle()))
                .toList();

        Mesa mesa = pedido.getMesa();
        Usuario mesero = pedido.getMesero();

        return new PedidoDashboardResponse(
                pedido.getId(), pedido.getTipo(), pedido.getEstado(), pedido.getTotal(), pedido.getCreatedAt(),
                mesa != null ? mesa.getId() : null, mesa != null ? mesa.getCodigo() : null,
                pedido.getDireccionDelivery(), detalles,
                mesero != null ? mesero.getId() : null,
                mesero != null ? mesero.getNombre() : null,
                mesero != null ? mesero.getTurno() : null);
    }
}