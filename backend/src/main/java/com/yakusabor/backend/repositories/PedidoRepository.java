package com.yakusabor.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yakusabor.backend.models.Pedido;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Integer> {
	// Consulta para obtener pedidos por el id de la mesa (usada en PedidoService)
	List<Pedido> findByMesa_Id(Integer mesaId);
}
