package com.yakusabor.backend.repositories;

import com.yakusabor.backend.models.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByEntidadOrderByFechaDesc(String entidad, Pageable pageable);
    Page<AuditLog> findByUsuarioIdOrderByFechaDesc(Integer usuarioId, Pageable pageable);
    Page<AuditLog> findAllByOrderByFechaDesc(Pageable pageable);
}