package br.com.finan.account;

import java.util.List;

import br.com.finan.shared.ApplicationException;
import br.com.finan.shared.ApplicationException.Type;
import br.com.finan.transaction.TransactionSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FinancialAccountService {

    private final FinancialAccountRepository repository;

    public FinancialAccountService(FinancialAccountRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public FinancialAccountResponse create(CreateFinancialAccountRequest request) {
        String name = request.name().strip();
        if (repository.existsByNameIgnoreCaseAndSourceAndActiveTrue(name, TransactionSource.MANUAL)) {
            throw new ApplicationException(Type.CONFLICT, "Active manual account already exists");
        }
        try {
            return toResponse(repository.saveAndFlush(
                    new FinancialAccount(name, request.type(), request.initialBalance())));
        } catch (DataIntegrityViolationException exception) {
            throw new ApplicationException(
                    Type.CONFLICT, "Active manual account already exists", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<FinancialAccountResponse> list() {
        return repository.findByActiveTrue(Sort.by(Sort.Order.asc("name").ignoreCase()))
                .stream().map(this::toResponse).toList();
    }

    private FinancialAccountResponse toResponse(FinancialAccount account) {
        return new FinancialAccountResponse(account.getId(), account.getName(), account.getType(),
                account.getSource(), account.getInitialBalance(), account.getProviderBalance(),
                account.isActive(), account.getLastSyncedAt(),
                account.getCreatedAt(), account.getUpdatedAt());
    }
}
