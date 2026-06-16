package com.liga1pro.repository;

import com.liga1pro.model.MiembroGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MiembroGrupoRepository extends JpaRepository<MiembroGrupo, Long> {

    List<MiembroGrupo> findByGrupoId(Long grupoId);

    Optional<MiembroGrupo> findByGrupoIdAndUsuarioId(Long grupoId, Long usuarioId);

    long countByGrupoId(Long grupoId);

    void deleteByGrupoIdAndUsuarioId(Long grupoId, Long usuarioId);
}