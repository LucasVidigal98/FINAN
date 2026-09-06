package br.com.finan.transaction;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {

    List<FinancialTransaction> findAllByOccurredOnBetween(LocalDate startDate, LocalDate endDate);
}
