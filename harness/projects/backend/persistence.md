# persistence

PostgreSQL 16 no Compose, Spring Data JPA e Flyway. application.yml mantém ddl-auto: validate e open-in-view: false. Migrations V1 a V7 em src/main/resources/db/migration cobrem fundação, transações, categorias, contas e lançamentos fixos. Nunca editar migrations aplicadas; verificar a maior versão e adicionar a próxima V<number>__description.sql. Usar BigDecimal para dinheiro. Preservar constraints e transações. Testes de integração usam banco separado e vazio.
