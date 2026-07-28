package com.yakusabor.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import com.yakusabor.backend.models.Producto;

public interface ProductoRepository extends JpaRepository<Producto, Integer> {
}
