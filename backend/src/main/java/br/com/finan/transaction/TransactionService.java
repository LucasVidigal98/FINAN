package br.com.finan.transaction;

import java.util.List;
import java.util.UUID;

import br.com.finan.account.FinancialAccount;
import br.com.finan.account.FinancialAccountRepository;
import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TransactionService {

    private final FinancialTransactionRepository repository;
    private final CategoryRepository categoryRepository;
    private final FinancialAccountRepository accountRepository;

    public TransactionService(FinancialTransactionRepository repository,
            CategoryRepository categoryRepository, FinancialAccountRepository accountRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.accountRepository = accountRepository;
    }

    @Transactional
    public TransactionResponse create(CreateTransactionRequest request) {
        FinancialTransaction transaction = new FinancialTransaction(
                request.description(), request.amount(), request.occurredOn(), request.type());
        transaction.setSource(TransactionSource.MANUAL);
        transaction.setCategory(findCategory(request.categoryId(), request.type()));
        transaction.setAccount(findAccount(request.accountId()));
        return toResponse(repository.save(transaction));
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> list() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "occurredOn"))
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public TransactionResponse updateCategory(UUID transactionId,
            UpdateTransactionCategoryRequest request) {
        FinancialTransaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Transaction not found"));
        transaction.setCategory(findCategory(request.categoryId(), transaction.getType()));
        return toResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateAccount(UUID transactionId,
            UpdateTransactionAccountRequest request) {
        FinancialTransaction transaction = repository.findById(transactionId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Transaction not found"));
        transaction.setAccount(findAccount(request.accountId()));
        return toResponse(transaction);
    }

    private FinancialAccount findAccount(UUID accountId) {
        if (accountId == null) {
            return null;
        }
        FinancialAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Account not found"));
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Account is inactive");
        }
        return account;
    }

    private Category findCategory(UUID categoryId, TransactionType transactionType) {
        if (categoryId == null) {
            return null;
        }
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is inactive");
        }
        if (category.getType() != transactionType) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category type does not match transaction type");
        }
        return category;
    }

    private TransactionResponse toResponse(FinancialTransaction transaction) {
        Category category = transaction.getCategory();
        FinancialAccount account = transaction.getAccount();
        return new TransactionResponse(
                transaction.getId(), transaction.getDescription(), transaction.getAmount(),
                transaction.getOccurredOn(), transaction.getType(), transaction.getSource(),
                category == null ? null : new CategorySummaryResponse(
                        category.getId(), category.getName(), category.getColor()),
                account == null ? null : new AccountSummaryResponse(
                        account.getId(), account.getName(), account.getType(), account.getSource()),
                transaction.getCreatedAt(), transaction.getUpdatedAt());
    }
}
