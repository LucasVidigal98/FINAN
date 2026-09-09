package br.com.finan.account;

import java.util.UUID;

import br.com.finan.transaction.TransactionSource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, UUID> {

    boolean existsByNameIgnoreCaseAndSourceAndActiveTrue(String name, TransactionSource source);
}
