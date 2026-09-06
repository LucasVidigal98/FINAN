package br.com.finan.category;

import br.com.finan.transaction.TransactionType;
import org.junit.jupiter.api.Test;
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
class CategoryControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private CategoryRepository repository;

    @Test
    void createsValidCategory() throws Exception {
        postCategory("Alimentação", "EXPENSE", "#EF4444")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Alimentação"))
                .andExpect(jsonPath("$.type").value("EXPENSE"))
                .andExpect(jsonPath("$.color").value("#EF4444"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.updatedAt").isNotEmpty());

        assertThat(repository.count()).isOne();
    }

    @Test
    void listsCategoriesAlphabetically() throws Exception {
        save("Transporte", TransactionType.EXPENSE);
        save("Alimentação", TransactionType.EXPENSE);
        save("Lazer", TransactionType.EXPENSE);

        mvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Alimentação"))
                .andExpect(jsonPath("$[1].name").value("Lazer"))
                .andExpect(jsonPath("$[2].name").value("Transporte"));
    }

    @Test
    void filtersByType() throws Exception {
        save("Salário", TransactionType.INCOME);
        save("Mercado", TransactionType.EXPENSE);

        mvc.perform(get("/api/categories").param("type", "INCOME"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Salário"));
    }

    @Test
    void rejectsDuplicateNameForSameTypeIgnoringCase() throws Exception {
        postCategory("Alimentação", "EXPENSE", null).andExpect(status().isCreated());
        postCategory("alimentação", "EXPENSE", null).andExpect(status().isConflict());
        assertThat(repository.count()).isOne();
    }

    @Test
    void allowsSameNameForDifferentTypes() throws Exception {
        postCategory("Outros", "EXPENSE", null).andExpect(status().isCreated());
        postCategory("Outros", "INCOME", null).andExpect(status().isCreated());
        assertThat(repository.count()).isEqualTo(2);
    }

    @Test
    void rejectsInvalidRequestsAndType() throws Exception {
        postCategory("", "EXPENSE", null).andExpect(status().isBadRequest());
        postCategory("a".repeat(51), "EXPENSE", null).andExpect(status().isBadRequest());
        postCategory("Lazer", null, null).andExpect(status().isBadRequest());
        postCategory("Lazer", "INVALID", null).andExpect(status().isBadRequest());
        postCategory("Lazer", "EXPENSE", "red").andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.ResultActions postCategory(
            String name, String type, String color) throws Exception {
        String body = "{\"name\":%s,\"type\":%s,\"color\":%s}".formatted(
                json(name), json(type), json(color));
        return mvc.perform(post("/api/categories").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private void save(String name, TransactionType type) {
        repository.save(new Category(name, type, null));
    }
}
