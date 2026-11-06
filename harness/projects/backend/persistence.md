# persistence

PostgreSQL 16 no Compose, Spring Data JPA e Flyway. application.yml mantém ddl-auto: validate e open-in-view: false. Migrations V1 a V7 em src/main/resources/db/migration cobrem fundação, transações, categorias, contas e lançamentos fixos. Nunca editar migrations aplicadas; verificar a maior versão e adicionar a próxima V<number>__description.sql. Usar BigDecimal para dinheiro. Preservar constraints e transações. Testes de integração usam banco separado e vazio.

Hoje as entidades usam JPA e os services dependem diretamente de repositories Spring Data. Não duplique repositories apenas para simular Clean Architecture. Quando uma feature precisar isolar persistência, defina a porta em linguagem de negócio no domínio/aplicação e implemente-a na infraestrutura, mantendo tipos JPA, consultas e mapping fora do núcleo. A transação deve cobrir o caso de uso que altera estado relacionado, não cada chamada isolada ao repository.
