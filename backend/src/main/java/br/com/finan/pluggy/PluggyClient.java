package br.com.finan.pluggy;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
@EnableConfigurationProperties(PluggyProperties.class)
public class PluggyClient {

    private final RestClient http;
    private final PluggyProperties properties;

    public PluggyClient(RestClient.Builder builder, PluggyProperties properties) {
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

    private record AuthRequest(String clientId, String clientSecret) {
    }

    private record AuthResponse(String apiKey) {
    }
}
