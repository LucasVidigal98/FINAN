package br.com.finan.account;

import java.util.UUID;
import java.util.List;

import br.com.finan.transaction.TransactionSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

public interface FinancialAccountRepository extends JpaRepository<FinancialAccount, UUID> {

    boolean existsByNameIgnoreCaseAndSourceAndActiveTrue(String name, TransactionSource source);

    List<FinancialAccount> findByActiveTrue(Sort sort);
}
