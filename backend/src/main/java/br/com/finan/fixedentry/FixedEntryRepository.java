package br.com.finan.fixedentry;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FixedEntryRepository extends JpaRepository<FixedEntry, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from FixedEntry f where f.active = true order by f.id")
    List<FixedEntry> findAllActiveForUpdate();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from FixedEntry f where f.id = :id")
    Optional<FixedEntry> findByIdForUpdate(@Param("id") UUID id);
}
