package br.com.finan.fixedentry;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import br.com.finan.transaction.FinancialTransaction;
import br.com.finan.transaction.FinancialTransactionRepository;
import br.com.finan.transaction.TransactionType;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FixedEntryService {

    private final FixedEntryRepository repository;
    private final CategoryRepository categoryRepository;
    private final FinancialTransactionRepository transactionRepository;
    private final Clock clock;

    public FixedEntryService(FixedEntryRepository repository, CategoryRepository categoryRepository,
            FinancialTransactionRepository transactionRepository, Clock clock) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.clock = clock;
    }

    @Transactional
    public FixedEntryResponse create(CreateFixedEntryRequest request) {
        rejectInvestment(request.type());
        Category category = findCategory(request.categoryId(), request.type());
        FixedEntry fixedEntry = new FixedEntry(request.description(), request.amount(), request.type(),
                category, request.startsOn(), LocalDate.now(clock));
        return toResponse(repository.saveAndFlush(fixedEntry));
    }

    @Transactional(readOnly = true)
    public List<FixedEntryResponse> list() {
        Sort sort = Sort.by(Sort.Order.asc("description").ignoreCase(), Sort.Order.asc("id"));
        return repository.findAll(sort).stream().map(this::toResponse).toList();
    }

    @Transactional
    public FixedEntryResponse updateActive(UUID id, UpdateFixedEntryActiveRequest request) {
        FixedEntry fixedEntry = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Fixed entry not found"));
        if (request.active() && !fixedEntry.isActive()) {
            findCategory(fixedEntry.getCategory().getId(), fixedEntry.getType());
            fixedEntry.activate(LocalDate.now(clock));
        } else if (!request.active() && fixedEntry.isActive()) {
            fixedEntry.deactivate();
        }
        return toResponse(fixedEntry);
    }

    @Transactional
    public void delete(UUID id) {
        FixedEntry fixedEntry = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Fixed entry not found"));
        transactionRepository.deleteAllByFixedEntry(fixedEntry);
        transactionRepository.flush();
        repository.delete(fixedEntry);
    }

    @Transactional
    public void materialize(YearMonth month) {
        LocalDate today = LocalDate.now(clock);
        LocalDate fixedMonth = month.atDay(1);
        int lastDay = month.lengthOfMonth();

        for (FixedEntry fixedEntry : repository.findAllActiveForUpdate()) {
            LocalDate dueOn = month.atDay(Math.min(fixedEntry.getStartsOn().getDayOfMonth(), lastDay));
            if (dueOn.isBefore(fixedEntry.getStartsOn())
                    || month.atEndOfMonth().isBefore(fixedEntry.getEligibleFrom())
                    || dueOn.isAfter(today)
                    || transactionRepository.existsByFixedEntryAndFixedMonth(fixedEntry, fixedMonth)) {
                continue;
            }

            Category category = findCategory(fixedEntry.getCategory().getId(), fixedEntry.getType());
            FinancialTransaction transaction = new FinancialTransaction(
                    fixedEntry.getDescription(), fixedEntry.getAmount(), dueOn, fixedEntry.getType());
            transaction.setCategory(category);
            transaction.setFixedEntry(fixedEntry);
            transaction.setFixedMonth(fixedMonth);
            transactionRepository.save(transaction);
        }
        transactionRepository.flush();
    }

    private Category findCategory(UUID categoryId, TransactionType type) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found"));
        if (!category.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is inactive");
        }
        if (category.getType() != type) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category type does not match fixed entry type");
        }
        return category;
    }

    private void rejectInvestment(TransactionType type) {
        if (type == TransactionType.INVESTMENT) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Fixed entries do not support investments");
        }
    }

    private FixedEntryResponse toResponse(FixedEntry fixedEntry) {
        return new FixedEntryResponse(fixedEntry.getId(), fixedEntry.getDescription(), fixedEntry.getAmount(),
                fixedEntry.getType(), fixedEntry.getCategory().getId(), fixedEntry.getStartsOn(),
                fixedEntry.getEligibleFrom(), fixedEntry.isActive(), fixedEntry.getCreatedAt(),
                fixedEntry.getUpdatedAt());
    }
}
