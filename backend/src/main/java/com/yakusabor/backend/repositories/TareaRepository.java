package com.yakusabor.backend.repositories;

import com.yakusabor.backend.models.Tarea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TareaRepository extends JpaRepository<Tarea, Long> {
    List<Tarea> findByMeseroIdAndEstadoOrderByCreatedAtDesc(Integer meseroId, String estado);
    List<Tarea> findByMeseroIdOrderByCreatedAtDesc(Integer meseroId);
}