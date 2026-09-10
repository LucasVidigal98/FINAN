package br.com.finan.account;

import java.math.BigDecimal;
import java.util.UUID;

import br.com.finan.transaction.TransactionSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FinancialAccountControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FinancialAccountRepository repository;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void createsManualAccount() throws Exception {
        create("  Nubank  ", "1500.00")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Nubank"))
                .andExpect(jsonPath("$.type").value("CHECKING"))
                .andExpect(jsonPath("$.source").value("MANUAL"))
                .andExpect(jsonPath("$.initialBalance").value(1500.00))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.providerBalance").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.lastSyncedAt").value(org.hamcrest.Matchers.nullValue()))
                .andExpect(jsonPath("$.externalId").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        FinancialAccount account = repository.findAll().getFirst();
        mvc.perform(get("/api/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(account.getId().toString()))
                .andExpect(jsonPath("$[0].name").value("Nubank"));
        assertThat(account.isActive()).isTrue();
        assertThat(account.getSource()).isEqualTo(TransactionSource.MANUAL);
        assertThat(account.getProviderBalance()).isNull();
        assertThat(account.getExternalId()).isNull();
        assertThat(account.getLastSyncedAt()).isNull();
        assertThat(account.getInitialBalance()).isEqualByComparingTo("1500.00");
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1500.25"})
    void acceptsZeroAndNegativeBalance(String balance) throws Exception {
        create("Carteira", balance).andExpect(status().isCreated());
        assertThat(repository.findAll().getFirst().getInitialBalance()).isEqualByComparingTo(balance);
    }

    @Test
    void listsOnlyActiveAccountsByName() throws Exception {
        insert("A inactive", "MANUAL", null, false);
        insert("Z inactive", "PLUGGY", "inactive-provider", false);
        insert("Banco", "PLUGGY", "private-provider-id", true);
        create("Nubank", "0").andExpect(status().isCreated());
        create("carteira", "0").andExpect(status().isCreated());
        create("Itau", "0").andExpect(status().isCreated());

        mvc.perform(get("/api/accounts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].name").value("Banco"))
                .andExpect(jsonPath("$[0].externalId").doesNotHaveJsonPath())
                .andExpect(jsonPath("$[1].name").value("carteira"))
                .andExpect(jsonPath("$[2].name").value("Itau"))
                .andExpect(jsonPath("$[3].name").value("Nubank"));
    }

    @Test
    void rejectsDuplicateActiveManualName() throws Exception {
        create("Nubank", "0").andExpect(status().isCreated());
        create(" nubank ", "1").andExpect(status().isConflict());
        assertThat(repository.count()).isOne();
    }

    @Test
    void enforcesDuplicateManualNameInDatabase() {
        repository.saveAndFlush(new FinancialAccount("Nubank", AccountType.CHECKING, BigDecimal.ZERO));
        assertThatThrownBy(() -> repository.saveAndFlush(
                new FinancialAccount("nubank", AccountType.SAVINGS, BigDecimal.ZERO)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void allowsNameOfInactiveManualOrPluggyAccount() throws Exception {
        insert("Nubank", "MANUAL", null, false);
        insert("Nubank", "PLUGGY", "pluggy-1", true);
        create("Nubank", "0").andExpect(status().isCreated());
        assertThat(repository.count()).isEqualTo(3);
    }

    @Test
    void enforcesExternalIdUniquenessPerSource() {
        insert("Conta 1", "PLUGGY", "external-1", true);
        insert("Conta 2", "MANUAL", "external-1", false);
        assertThatThrownBy(() -> insert("Conta 3", "PLUGGY", "external-1", false))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void allowsMultipleNullExternalIds() {
        insert("Conta 1", "PLUGGY", null, true);
        insert("Conta 2", "PLUGGY", null, true);
        assertThat(repository.count()).isEqualTo(2);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "\"source\":\"PLUGGY\"",
            "\"providerBalance\":9000",
            "\"externalId\":\"injected\"",
            "\"lastSyncedAt\":\"2026-09-01T00:00:00Z\"",
            "\"active\":false"
    })
    void manualEndpointRejectsProviderFieldsAndActiveFlag(String field) throws Exception {
        postJson("{\"name\":\"Nubank\",\"type\":\"CHECKING\",\"initialBalance\":10," + field + "}")
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    @Test
    void rejectsInvalidManualRequests() throws Exception {
        create(" ", "0").andExpect(status().isBadRequest());
        create("a".repeat(81), "0").andExpect(status().isBadRequest());
        create("Nubank", "null").andExpect(status().isBadRequest());
        postJson("{\"type\":\"CASH\",\"initialBalance\":0}").andExpect(status().isBadRequest());
        postJson("{\"name\":\"Carteira\",\"initialBalance\":0}").andExpect(status().isBadRequest());
        postJson("{\"name\":\"Carteira\",\"type\":\"CASH\"}").andExpect(status().isBadRequest());
        postJson("{\"name\":\"Cartao\",\"type\":\"CREDIT_CARD\",\"initialBalance\":0}")
                .andExpect(status().isBadRequest());
        assertThat(repository.count()).isZero();
    }

    private ResultActions create(String name, String balance) throws Exception {
        return postJson("{\"name\":\"%s\",\"type\":\"CHECKING\",\"initialBalance\":%s}"
                .formatted(name, balance));
    }

    private ResultActions postJson(String body) throws Exception {
        return mvc.perform(post("/api/accounts").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private void insert(String name, String source, String externalId, boolean active) {
        jdbc.update("""
                INSERT INTO financial_accounts
                    (id, name, type, source, initial_balance, external_id, active, created_at, updated_at)
                VALUES (?, ?, 'CHECKING', ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """, UUID.randomUUID(), name, source, externalId, active);
    }
}
