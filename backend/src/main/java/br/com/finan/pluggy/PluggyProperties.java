package br.com.finan.pluggy;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "pluggy")
public record PluggyProperties(String clientId, String clientSecret) {
}
