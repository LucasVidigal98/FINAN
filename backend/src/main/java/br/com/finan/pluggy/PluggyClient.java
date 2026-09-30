package br.com.finan.pluggy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Component
@EnableConfigurationProperties(PluggyProperties.class)
public class PluggyClient {

    private final RestClient http;
    private final PluggyProperties properties;

    @Autowired
    public PluggyClient(PluggyProperties properties) {
        this(RestClient.builder(), properties);
    }

    PluggyClient(RestClient.Builder builder, PluggyProperties properties) {
        this.http = builder.baseUrl("https://api.pluggy.ai").build();
        this.properties = properties;
    }

    public String authenticate() {
        if (properties.clientId() == null || properties.clientId().isBlank()
                || properties.clientSecret() == null || properties.clientSecret().isBlank()) {
            throw new IllegalStateException("Pluggy credentials are not configured");
        }

        try {
            AuthResponse response = http.post().uri("/auth").contentType(MediaType.APPLICATION_JSON)
                    .body(new AuthRequest(properties.clientId(), properties.clientSecret()))
                    .retrieve().body(AuthResponse.class);
            if (response == null || response.apiKey() == null || response.apiKey().isBlank()) {
                throw new IllegalStateException("Pluggy authentication returned no API key");
            }
            return response.apiKey();
        } catch (RestClientException exception) {
            throw new IllegalStateException("Pluggy authentication failed");
        }
    }

    public String createConnectToken() {
        String apiKey = authenticate();
        try {
            return requestConnectToken(apiKey);
        } catch (RestClientResponseException exception) {
            if (exception.getStatusCode().value() == 401) {
                try {
                    return requestConnectToken(authenticate());
                } catch (RestClientException retryFailure) {
                    throw new IllegalStateException("Pluggy Connect Token request failed");
                }
            }
            throw new IllegalStateException("Pluggy Connect Token request failed");
        } catch (RestClientException exception) {
            throw new IllegalStateException("Pluggy Connect Token request failed");
        }
    }

    private String requestConnectToken(String apiKey) {
        ConnectTokenResponse response = http.post().uri("/connect_token")
                .contentType(MediaType.APPLICATION_JSON).header("X-API-KEY", apiKey)
                .body("{}").retrieve().body(ConnectTokenResponse.class);
        if (response == null || response.accessToken() == null || response.accessToken().isBlank()) {
            throw new IllegalStateException("Pluggy Connect Token request failed");
        }
        return response.accessToken();
    }

    private record AuthRequest(String clientId, String clientSecret) {
    }

    private record AuthResponse(String apiKey) {
    }

    private record ConnectTokenResponse(String accessToken) {
    }
}
