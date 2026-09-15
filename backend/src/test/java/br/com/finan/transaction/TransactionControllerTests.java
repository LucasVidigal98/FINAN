package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import br.com.finan.account.AccountType;
import br.com.finan.account.FinancialAccount;
import br.com.finan.account.FinancialAccountRepository;
import br.com.finan.category.Category;
import br.com.finan.category.CategoryRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.EnumSource;
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
    private FinancialAccountRepository accountRepository;

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
                .andExpect(jsonPath("$.account").doesNotExist())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        repository.flush();
        assertThat(repository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getAmount()).isEqualByComparingTo("123.45");
            assertThat(transaction.getSource()).isEqualTo(TransactionSource.MANUAL);
            assertThat(transaction.getAccount()).isNull();
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

    @ParameterizedTest
    @EnumSource(TransactionSource.class)
    void createsWithAccountAndListsSummaryWithoutChangingAccount(TransactionSource source) throws Exception {
        FinancialAccount account = saveAccount("Nubank");
        entityManager.createNativeQuery("""
                UPDATE financial_accounts SET source = :source, provider_balance = 987.65,
                external_id = 'external-account', last_synced_at = '2026-09-01T12:00:00Z'
                WHERE id = :id
                """).setParameter("source", source.name()).setParameter("id", account.getId())
                .executeUpdate();
        entityManager.clear();
        Object[] before = accountSnapshot(account.getId());

        postWithAccount(account.getId())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.source").value("MANUAL"))
                .andExpect(jsonPath("$.account.id").value(account.getId().toString()))
                .andExpect(jsonPath("$.account.name").value("Nubank"))
                .andExpect(jsonPath("$.account.type").value("CHECKING"))
                .andExpect(jsonPath("$.account.source").value(source.name()));

        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findAll()).singleElement().satisfies(transaction ->
                assertThat(transaction.getAccount().getId()).isEqualTo(account.getId()));
        assertThat(accountSnapshot(account.getId())).containsExactly(before);
        mvc.perform(get("/api/transactions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].account.id").value(account.getId().toString()))
                .andExpect(jsonPath("$[0].account.name").value("Nubank"))
                .andExpect(jsonPath("$[0].account.type").value("CHECKING"))
                .andExpect(jsonPath("$[0].account.source").value(source.name()));
    }

    @Test
    void createsWithExplicitNullAccount() throws Exception {
        postWithAccount(null).andExpect(status().isCreated())
                .andExpect(jsonPath("$.account").doesNotExist());
        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findAll()).singleElement().satisfies(transaction ->
                assertThat(transaction.getAccount()).isNull());
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void rejectsUnknownOrInactiveAccountOnCreateAndPatch(boolean inactive) throws Exception {
        UUID accountId = UUID.randomUUID();
        if (inactive) {
            accountId = saveAccount("Inactive").getId();
            entityManager.createNativeQuery("UPDATE financial_accounts SET active = false WHERE id = :id")
                    .setParameter("id", accountId).executeUpdate();
            entityManager.clear();
        }
        int expectedStatus = inactive ? 400 : 404;
        postWithAccount(accountId).andExpect(status().is(expectedStatus));
        assertThat(repository.count()).isZero();

        FinancialAccount original = saveAccount("Original");
        FinancialTransaction transaction = save("Mercado", LocalDate.of(2026, 9, 5));
        transaction.setAccount(original);
        entityManager.flush();
        patchAccount(transaction.getId(), accountId).andExpect(status().is(expectedStatus));
        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findById(transaction.getId()).orElseThrow().getAccount().getId())
                .isEqualTo(original.getId());
    }

    @ParameterizedTest
    @EnumSource(TransactionSource.class)
    void changesAndRemovesAccountWithoutChangingBalances(TransactionSource source) throws Exception {
        FinancialAccount original = saveAccount("Original");
        FinancialAccount replacement = saveAccount("Replacement");
        FinancialTransaction transaction = save("Mercado", LocalDate.of(2026, 9, 5));
        transaction.setSource(source);
        transaction.setAccount(original);
        entityManager.flush();
        entityManager.clear();

        Object[] originalBefore = accountSnapshot(original.getId());
        Object[] replacementBefore = accountSnapshot(replacement.getId());
        patchAccount(transaction.getId(), replacement.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.source").value(source.name()))
                .andExpect(jsonPath("$.account.id").value(replacement.getId().toString()));
        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findById(transaction.getId()).orElseThrow().getAccount().getId())
                .isEqualTo(replacement.getId());

        patchAccount(transaction.getId(), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.account").doesNotExist());
        entityManager.flush();
        entityManager.clear();
        assertThat(repository.findById(transaction.getId()).orElseThrow().getAccount()).isNull();
        assertThat(accountSnapshot(original.getId())).containsExactly(originalBefore);
        assertThat(accountSnapshot(replacement.getId())).containsExactly(replacementBefore);
    }

    @Test
    void rejectsAccountUpdateForUnknownTransaction() throws Exception {
        patchAccount(UUID.randomUUID(), null).andExpect(status().isNotFound());
    }

    private Object[] accountSnapshot(UUID id) {
        return (Object[]) entityManager.createNativeQuery("SELECT * FROM financial_accounts WHERE id = :id")
                .setParameter("id", id).getSingleResult();
    }

    private FinancialAccount saveAccount(String name) {
        return accountRepository.saveAndFlush(
                new FinancialAccount(name, AccountType.CHECKING, new BigDecimal("100.00")));
    }

    private org.springframework.test.web.servlet.ResultActions postWithAccount(UUID accountId)
            throws Exception {
        return mvc.perform(post("/api/transactions").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"description":"Mercado","amount":10.00,"occurredOn":"2026-09-05",
                         "type":"EXPENSE","accountId":%s}
                        """.formatted(accountId == null ? "null" : "\"" + accountId + "\"")));
    }

    private org.springframework.test.web.servlet.ResultActions patchAccount(UUID transactionId, UUID accountId)
            throws Exception {
        return mvc.perform(patch("/api/transactions/{id}/account", transactionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountId\":%s}".formatted(accountId == null ? "null" : "\"" + accountId + "\"")));
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
