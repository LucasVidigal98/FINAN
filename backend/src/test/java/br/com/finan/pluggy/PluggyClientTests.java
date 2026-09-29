package br.com.finan.pluggy;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withUnauthorizedRequest;

class PluggyClientTests {

    @Test
    void authenticatesWithConfiguredCredentials() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(once(), requestTo("https://api.pluggy.ai/auth"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Content-Type", "application/json"))
                .andExpect(content().json("""
                        {"clientId":"test-id","clientSecret":"test-secret"}
                        """))
                .andRespond(withSuccess("""
                        {"apiKey":"test-api-key"}
                        """, MediaType.APPLICATION_JSON));

        String apiKey = new PluggyClient(builder, new PluggyProperties("test-id", "test-secret"))
                .authenticate();

        assertThat(apiKey).isEqualTo("test-api-key");
        server.verify();
    }

    @Test
    void hidesSensitiveResponseWhenAuthenticationFails() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        server.expect(once(), requestTo("https://api.pluggy.ai/auth"))
                .andRespond(withUnauthorizedRequest().body("test-secret test-api-key"));

        assertThatThrownBy(() -> new PluggyClient(builder,
                new PluggyProperties("test-id", "test-secret")).authenticate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Pluggy authentication failed")
                .hasNoCause();
        server.verify();
    }

    @Test
    void rejectsMissingCredentialsBeforeSendingRequest() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

        assertThatThrownBy(() -> new PluggyClient(builder, new PluggyProperties("", ""))
                .authenticate())
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Pluggy credentials are not configured");
        server.verify();
    }
}
