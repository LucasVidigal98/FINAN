package br.com.finan.transaction;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {

    private final FinancialTransactionRepository repository;

    public TransactionService(FinancialTransactionRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TransactionResponse create(CreateTransactionRequest request) {
        FinancialTransaction transaction = new FinancialTransaction(
                request.description(), request.amount(), request.occurredOn(), request.type());
        transaction.setSource(TransactionSource.MANUAL);
        return toResponse(repository.save(transaction));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "occurredOn"))
                .stream().map(this::toResponse).toList();
    }

    private TransactionResponse toResponse(FinancialTransaction transaction) {
        return new TransactionResponse(
                transaction.getId(), transaction.getDescription(), transaction.getAmount(),
                transaction.getOccurredOn(), transaction.getType(), transaction.getSource(),
                transaction.getCreatedAt(), transaction.getUpdatedAt());
    }
}
