# Orientações específicas: backend

Workspace Java 21 / Spring Boot do FINAN, com frontend em ../frontend e Harness em ../harness; Git compartilhado na pasta pai.
Pacotes por domínio em src/main/java/br/com/finan e testes espelhados em src/test/java. Quatro espaços em Java, PascalCase nas classes, camelCase nos membros.
Valide entradas no backend e use BigDecimal para dinheiro. Preserve transações e tratamento de erros.
Migrations em src/main/resources/db/migration: nunca editar versões aplicadas, adicionar a próxima versão e preservar ddl-auto: validate.
Testes de integração exigem PostgreSQL separado e vazio; consulte ../harness/projects/backend/tests.md.
Edite esta fonte em ../harness/projects/backend/codex/project.md e execute node ../harness/scripts/harness.mjs sync backend; não edite o AGENTS.md gerado.
