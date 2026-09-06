package br.com.finan.category;

import java.util.List;

import br.com.finan.transaction.TransactionType;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CategoryService {

    private final CategoryRepository repository;

    public CategoryService(CategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request) {
        if (repository.existsByNameIgnoreCaseAndType(request.name(), request.type())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists");
        }
        try {
            return toResponse(repository.saveAndFlush(
                    new Category(request.name(), request.type(), request.color())));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category already exists", exception);
        }
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(TransactionType type) {
        Sort sort = Sort.by(Sort.Order.asc("name").ignoreCase());
        List<Category> categories = type == null
                ? repository.findAll(sort)
                : repository.findAllByType(type, sort);
        return categories.stream().map(this::toResponse).toList();
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getType(),
                category.getColor(), category.isActive(), category.getCreatedAt(),
                category.getUpdatedAt());
    }
}
