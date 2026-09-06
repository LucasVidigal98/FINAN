package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class TransactionControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FinancialTransactionRepository repository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void createsExpenseWithManualSource() throws Exception {
        mvc.perform(post("/api/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"Mercado","amount":123.45,
                                 "occurredOn":"2026-09-05","type":"EXPENSE"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.description").value("Mercado"))
                .andExpect(jsonPath("$.amount").value(123.45))
                .andExpect(jsonPath("$.occurredOn").value("2026-09-05"))
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.source").value("MANUAL"))
                .andExpect(jsonPath("$.category").doesNotExist())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        repository.flush();
        assertThat(repository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getAmount()).isEqualByComparingTo("123.45");
            assertThat(transaction.getSource()).isEqualTo(TransactionSource.MANUAL);
        });
    }

    @Test
    void createsTransactionWithCompatibleCategory() throws Exception {
        Category category = saveCategory("Alimentação", TransactionType.EXPENSE, "#EF4444");

        postTransaction(category.getId(), TransactionType.EXPENSE)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category.id").value(category.getId().toString()))
                .andExpect(jsonPath("$.category.name").value("Alimentação"))
                .andExpect(jsonPath("$.category.color").value("#EF4444"));

        assertThat(repository.findAll()).singleElement().satisfies(transaction ->
                assertThat(transaction.getCategory().getId()).isEqualTo(category.getId()));
    }

    @Test
    void rejectsUnknownCategory() throws Exception {
        postTransaction(UUID.randomUUID(), TransactionType.EXPENSE)
                .andExpect(status().isNotFound());

        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsInactiveCategory() throws Exception {
        Category category = saveCategory("Alimentação", TransactionType.EXPENSE, null);
        entityManager.createNativeQuery("UPDATE categories SET active = false WHERE id = :id")
                .setParameter("id", category.getId()).executeUpdate();
        entityManager.clear();

        postTransaction(category.getId(), TransactionType.EXPENSE)
                .andExpect(status().isBadRequest());

        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsCategoryWithDifferentType() throws Exception {
        Category category = saveCategory("Salário", TransactionType.INCOME, null);

        postTransaction(category.getId(), TransactionType.EXPENSE)
                .andExpect(status().isBadRequest());

        assertThat(repository.count()).isZero();
    }

    @Test
    void categorizesExistingTransaction() throws Exception {
        FinancialTransaction transaction = save("Mercado", LocalDate.of(2026, 9, 5));
        Category category = saveCategory("Alimentação", TransactionType.EXPENSE, "#EF4444");

        mvc.perform(patch("/api/transactions/{id}/category", transaction.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":\"%s\"}".formatted(category.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category.id").value(category.getId().toString()));

        assertThat(repository.findById(transaction.getId()).orElseThrow().getCategory().getId())
                .isEqualTo(category.getId());
    }

    @Test
    void removesCategoryFromTransaction() throws Exception {
        Category category = saveCategory("Alimentação", TransactionType.EXPENSE, null);
        FinancialTransaction transaction = new FinancialTransaction(
                "Mercado", new BigDecimal("10.00"), LocalDate.of(2026, 9, 5),
                TransactionType.EXPENSE);
        transaction.setCategory(category);
        repository.save(transaction);

        mvc.perform(patch("/api/transactions/{id}/category", transaction.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoryId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").doesNotExist());

        assertThat(repository.findById(transaction.getId()).orElseThrow().getCategory()).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "\"description\":\"\"", "\"description\":\"   \"", "\"description\":null",
            "\"amount\":0", "\"amount\":-1", "\"amount\":0.001", "\"amount\":null",
            "\"occurredOn\":null", "\"occurredOn\":\"invalid\"",
            "\"type\":null", "\"type\":\"INVALID\""
    })
    void rejectsInvalidInput(String invalidField) throws Exception {
        String fieldName = invalidField.substring(0, invalidField.indexOf(':'));
        String[] validFields = {"\"description\":\"Mercado\"", "\"amount\":10.00",
                "\"occurredOn\":\"2026-09-05\"", "\"type\":\"EXPENSE\""};
        String body = "{" + java.util.Arrays.stream(validFields)
                .map(field -> field.startsWith(fieldName + ":") ? invalidField : field)
                .collect(java.util.stream.Collectors.joining(",")) + "}";

        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsDescriptionLongerThan150Characters() throws Exception {
        mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"description":"%s","amount":10,
                                 "occurredOn":"2026-09-05","type":"EXPENSE"}
                                """.formatted("a".repeat(151))))
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @Test
    void listsTransactionsByOccurredOnDescending() throws Exception {
        save("Antiga", LocalDate.of(2026, 8, 1));
        save("Recente", LocalDate.of(2026, 9, 5));
        save("Intermediaria", LocalDate.of(2026, 9, 2));

        mvc.perform(get("/api/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].description").value("Recente"))
                .andExpect(jsonPath("$[1].description").value("Intermediaria"))
                .andExpect(jsonPath("$[2].description").value("Antiga"));
    }

    @Test
    void listsEmptyArrayWhenThereAreNoTransactions() throws Exception {
        mvc.perform(get("/api/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    private FinancialTransaction save(String description, LocalDate occurredOn) {
        return repository.save(new FinancialTransaction(
                description, new BigDecimal("10.00"), occurredOn, TransactionType.EXPENSE));
    }

    private Category saveCategory(String name, TransactionType type, String color) {
        return categoryRepository.save(new Category(name, type, color));
    }

    private org.springframework.test.web.servlet.ResultActions postTransaction(
            UUID categoryId, TransactionType type) throws Exception {
        return mvc.perform(post("/api/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"description":"Mercado","amount":10.00,
                         "occurredOn":"2026-09-05","type":"%s","categoryId":"%s"}
                        """.formatted(type, categoryId)));
    }
}
