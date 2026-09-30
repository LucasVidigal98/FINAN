package br.com.finan.pluggy;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withUnauthorizedRequest;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConnectTokenControllerTests {

    @Test
    void returnsOnlyConnectToken() throws Exception {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-one\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andExpect(header("X-API-KEY", "key-one"))
                .andExpect(org.springframework.test.web.client.match.MockRestRequestMatchers.content().json("{}"))
                .andRespond(withSuccess("{\"accessToken\":\"connect-one\"}", MediaType.APPLICATION_JSON));

        mvc(builder).perform(post("/api/open-finance/connect-token"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header()
                        .string("Cache-Control", "no-store"))
                .andExpect(content().string("{\"connectToken\":\"connect-one\"}"));
        server.verify();
    }

    @Test
    void hidesExternalFailure() throws Exception {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-one\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andRespond(withServerError().body("secret-body key-one"));

        String body = mvc(builder).perform(post("/api/open-finance/connect-token"))
                .andExpect(status().isBadGateway()).andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("secret-body", "key-one");
        server.verify();
    }

    @Test
    void refreshesApiKeyOnceAfterUnauthorized() throws Exception {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-one\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andExpect(header("X-API-KEY", "key-one"))
                .andRespond(withUnauthorizedRequest().body("sensitive-response"));
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-two\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andExpect(header("X-API-KEY", "key-two"))
                .andRespond(withSuccess("{\"accessToken\":\"connect-two\"}", MediaType.APPLICATION_JSON));

        mvc(builder).perform(post("/api/open-finance/connect-token"))
                .andExpect(status().isOk())
                .andExpect(content().string("{\"connectToken\":\"connect-two\"}"));
        server.verify();
    }

    @Test
    void stopsAfterSecondUnauthorized() throws Exception {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-one\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andRespond(withUnauthorizedRequest());
        server.expect(requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withSuccess("{\"apiKey\":\"key-two\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://api.pluggy.ai/connect_token"))
                .andExpect(header("X-API-KEY", "key-two"))
                .andRespond(withUnauthorizedRequest().body("sensitive-response"));

        String body = mvc(builder).perform(post("/api/open-finance/connect-token"))
                .andExpect(status().isBadGateway()).andReturn().getResponse().getContentAsString();
        assertThat(body).doesNotContain("sensitive-response", "key-two");
        server.verify();
    }

    private MockMvc mvc(RestClient.Builder builder) {
        PluggyClient client = new PluggyClient(builder, new PluggyProperties("test-id", "test-secret"));
        return MockMvcBuilders.standaloneSetup(new ConnectTokenController(client)).build();
    }
}
