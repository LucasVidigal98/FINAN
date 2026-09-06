package br.com.finan.category;

import java.util.List;
import java.util.UUID;

import br.com.finan.transaction.TransactionType;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    boolean existsByNameIgnoreCaseAndType(String name, TransactionType type);

    List<Category> findAllByType(TransactionType type, Sort sort);
}
