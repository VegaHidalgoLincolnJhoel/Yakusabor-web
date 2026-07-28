package com.yakusabor.backend.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.yakusabor.backend.models.Mesa;

public interface MesaRepository extends JpaRepository<Mesa, Integer> {
}
