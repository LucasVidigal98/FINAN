package br.com.finan;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class FinanApplication {

	public static void main(String[] args) {
		SpringApplication.run(FinanApplication.class, args);
	}

	@Bean
	Clock clock() {
		return Clock.system(ZoneId.of("America/Sao_Paulo"));
	}

}
