package br.com.finan.transaction;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, UUID> {
}
