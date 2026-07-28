package com.yakusabor.backend.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mesero_id", nullable = false)
    private Integer meseroId;

    @Column(name = "asignado_por", length = 120, nullable = false)
    private String asignadoPor;

    @Column(name = "mensaje", length = 255, nullable = false)
    private String mensaje;

    @Column(name = "estado", length = 20)
    private String estado = "pendiente";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public Long getId() { return id; }
    public Integer getMeseroId() { return meseroId; }
    public void setMeseroId(Integer meseroId) { this.meseroId = meseroId; }
    public String getAsignadoPor() { return asignadoPor; }
    public void setAsignadoPor(String asignadoPor) { this.asignadoPor = asignadoPor; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}