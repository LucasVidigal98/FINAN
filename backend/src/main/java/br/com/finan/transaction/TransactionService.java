package br.com.finan.transaction;

import java.util.List;
import java.util.UUID;

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

    public TransactionService(FinancialTransactionRepository repository,
            CategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public TransactionResponse create(CreateTransactionRequest request) {
        FinancialTransaction transaction = new FinancialTransaction(
                request.description(), request.amount(), request.occurredOn(), request.type());
        transaction.setSource(TransactionSource.MANUAL);
        transaction.setCategory(findCategory(request.categoryId(), request.type()));
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
        return new TransactionResponse(
                transaction.getId(), transaction.getDescription(), transaction.getAmount(),
                transaction.getOccurredOn(), transaction.getType(), transaction.getSource(),
                category == null ? null : new CategorySummaryResponse(
                        category.getId(), category.getName(), category.getColor()),
                transaction.getCreatedAt(), transaction.getUpdatedAt());
    }
}
