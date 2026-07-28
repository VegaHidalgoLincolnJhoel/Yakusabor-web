// ProductoService.java
package com.yakusabor.backend.services;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.yakusabor.backend.models.Categoria;
import com.yakusabor.backend.models.Producto;
import com.yakusabor.backend.repositories.CategoriaRepository;
import com.yakusabor.backend.repositories.ProductoRepository;

@Service
public class ProductoService {

    @Autowired private ProductoRepository productoRepository;
    @Autowired private CategoriaRepository categoriaRepository;

    public List<Producto> obtenerProductos() {
        return productoRepository.findAll();
    }

    public Producto obtenerProducto(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado."));
    }

    public Producto crearProducto(Map<String, Object> body) {
        return productoRepository.save(buildProducto(new Producto(), body));
    }

    public Producto editarProducto(Integer id, Map<String, Object> body) {
        Producto p = obtenerProducto(id);
        return productoRepository.save(buildProducto(p, body));
    }

    public Producto actualizarDisponibilidad(Integer id, Map<String, Object> body) {
        Producto p = obtenerProducto(id);
        Object val = body.get("disponible");
        if (val == null) throw new IllegalArgumentException("Falta el campo 'disponible'.");
        p.setDisponible(Boolean.parseBoolean(String.valueOf(val)));
        return productoRepository.save(p);
    }

    public void eliminarProducto(Integer id) {
        if (!productoRepository.existsById(id)) {
            throw new IllegalArgumentException("Producto no encontrado.");
        }
        productoRepository.deleteById(id);
    }

    private Producto buildProducto(Producto p, Map<String, Object> body) {
        String nombre = getString(body, "nombre");
        if (nombre == null || nombre.isBlank()) throw new IllegalArgumentException("El nombre es obligatorio.");

        Object precioRaw = body.get("precio");
        if (precioRaw == null) throw new IllegalArgumentException("El precio es obligatorio.");
        double precio;
        try { precio = Double.parseDouble(String.valueOf(precioRaw)); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Precio inválido."); }
        if (precio < 0) throw new IllegalArgumentException("El precio no puede ser negativo.");

        String catNombre = getString(body, "categoriaNombre");
        if (catNombre == null || catNombre.isBlank()) throw new IllegalArgumentException("La categoría es obligatoria.");

        Categoria cat = categoriaRepository.findByNombre(catNombre)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada: " + catNombre));

        p.setNombre(nombre.trim());
        p.setDescripcion(getString(body, "descripcion"));
        p.setPrecio(precio);
        p.setCategoria(cat);

        if (body.containsKey("disponible")) {
            p.setDisponible(Boolean.parseBoolean(String.valueOf(body.get("disponible"))));
        } else if (p.getDisponible() == null) {
            p.setDisponible(true);
        }

        return p;
    }

    private String getString(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? null : String.valueOf(v).trim();
    }
}