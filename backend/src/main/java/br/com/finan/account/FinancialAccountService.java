package br.com.finan.account;

import java.util.List;

import br.com.finan.transaction.TransactionSource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Active manual account already exists");
        }
        try {
            return toResponse(repository.saveAndFlush(
                    new FinancialAccount(name, request.type(), request.initialBalance())));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Active manual account already exists", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<FinancialAccountResponse> list() {
        return repository.findAll(Sort.by(Sort.Order.asc("name").ignoreCase()))
                .stream().map(this::toResponse).toList();
    }

    private FinancialAccountResponse toResponse(FinancialAccount account) {
        return new FinancialAccountResponse(account.getId(), account.getName(), account.getType(),
                account.getSource(), account.getInitialBalance(), account.getProviderBalance(),
                account.getExternalId(), account.isActive(), account.getLastSyncedAt(),
                account.getCreatedAt(), account.getUpdatedAt());
    }
}
