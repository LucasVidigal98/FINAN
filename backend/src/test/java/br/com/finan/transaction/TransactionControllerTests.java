package br.com.finan.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

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
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        repository.flush();
        assertThat(repository.findAll()).singleElement().satisfies(transaction -> {
            assertThat(transaction.getAmount()).isEqualByComparingTo("123.45");
            assertThat(transaction.getSource()).isEqualTo(TransactionSource.MANUAL);
        });
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

    private void save(String description, LocalDate occurredOn) {
        repository.save(new FinancialTransaction(
                description, new BigDecimal("10.00"), occurredOn, TransactionType.EXPENSE));
    }
}
