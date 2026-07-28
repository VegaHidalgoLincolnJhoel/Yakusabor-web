package com.yakusabor.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id")
    private Integer usuarioId;

    @Column(name = "usuario_email", length = 120)
    private String usuarioEmail;

    @Column(name = "rol", length = 50)
    private String rol;

    @Column(name = "accion", length = 50, nullable = false)
    private String accion;

    @Column(name = "entidad", length = 60, nullable = false)
    private String entidad;

    @Column(name = "entidad_id")
    private Long entidadId;

    @Column(name = "detalle", columnDefinition = "TEXT")
    private String detalle;

    @Column(name = "ip_origen", length = 64)
    private String ipOrigen;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    public AuditLog() {}

    public Long getId() { return id; }
    public Integer getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Integer usuarioId) { this.usuarioId = usuarioId; }
    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getEntidad() { return entidad; }
    public void setEntidad(String entidad) { this.entidad = entidad; }
    public Long getEntidadId() { return entidadId; }
    public void setEntidadId(Long entidadId) { this.entidadId = entidadId; }
    public String getDetalle() { return detalle; }
    public void setDetalle(String detalle) { this.detalle = detalle; }
    public String getIpOrigen() { return ipOrigen; }
    public void setIpOrigen(String ipOrigen) { this.ipOrigen = ipOrigen; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
}