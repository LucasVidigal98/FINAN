# decisions

2026-10-14: por solicitação do usuário, backend e frontend são projetos separados no Harness com um único Git em FINAN. Codex configurado com fontes em harness/ e symlinks por aplicação. Não executar bootstrap sobre a aplicação existente. Estado existente: Java 21, Spring Boot, PostgreSQL, JPA e Flyway; preservar ddl-auto: validate e migrations aplicadas.
