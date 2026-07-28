package com.yakusabor.backend.services;

import com.yakusabor.backend.models.AuditLog;
import com.yakusabor.backend.repositories.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void registrar(String accion, String entidad, Long entidadId, String detalle) {
        AuditLog log = new AuditLog();
        log.setAccion(accion);
        log.setEntidad(entidad);
        log.setEntidadId(entidadId);
        log.setDetalle(detalle);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            log.setUsuarioEmail(auth.getName());
            auth.getAuthorities().stream().findFirst()
                    .ifPresent(a -> log.setRol(a.getAuthority().replace("ROLE_", "")));
        } else {
            log.setUsuarioEmail("SISTEMA");
        }

        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                log.setIpOrigen(ip != null ? ip : request.getRemoteAddr());
            }
        } catch (Exception ignored) { }

        auditLogRepository.save(log);
    }

    public void registrarSimple(String accion, String entidad) {
        registrar(accion, entidad, null, null);
    }
}