# architecture

Java 21, Spring Boot 4.1.1 e Gradle. Pacotes por domínio sob src/main/java/br/com/finan: account, category, dashboard, fixedentry, transaction e pluggy. Controllers delegam aos services; repositories Spring Data JPA acessam PostgreSQL. DTOs definem contratos. PluggyClient usa RestClient e existe endpoint de connect token; isso não comprova importação bancária completa. Infraestrutura em ../docker-compose.yml e consumidor em ../frontend.
