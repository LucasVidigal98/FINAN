# Finan

Aplicativo financeiro pessoal para acompanhar receitas, despesas, investimentos e saldo mensal em um único lugar.

## Escopo inicial

O projeto será construído com:

- **Frontend:** Angular
- **Backend:** Spring Boot com Java 21
- **Banco de dados:** PostgreSQL
- **Modos de uso planejados:** manual, Pluggy/Open Finance e híbrido

### Primeiro MVP

O primeiro MVP terá foco no cadastro manual de:

- Receitas
- Despesas
- Investimentos

O dashboard inicial deverá apresentar:

- Total de receitas
- Total de gastos
- Total investido
- Saldo mensal

A integração com bancos, Pluggy e Open Finance está prevista para uma etapa futura e não faz parte desta fundação.

## Estrutura do projeto

```text
finan/
├── frontend/          # Aplicação Angular
├── backend/            # API Spring Boot + Java 21
├── docker-compose.yml  # Serviços locais, inicialmente PostgreSQL
├── .env.example        # Variáveis de ambiente esperadas
└── README.md
```

## Arquitetura planejada

```text
Angular (frontend)  <->  API REST (Spring Boot)  <->  PostgreSQL
```

O frontend será responsável pela experiência de uso e pelo dashboard. O backend concentrará as regras de negócio, validações e persistência. O PostgreSQL armazenará os dados financeiros do usuário.

## Pré-requisitos

- Docker e Docker Compose

Java, Gradle, Node.js e demais ferramentas de desenvolvimento rodam em containers e não precisam ser instalados na máquina.

## Backend

O backend usa Java 21, Gradle e Spring Boot. Para construir a imagem e executar os testes iniciais:

```bash
docker compose build backend
docker compose run --rm backend ./gradlew test
```

Para iniciar o backend e o PostgreSQL:

```bash
docker compose up backend
```

O diretório `backend/` é montado no container. Ao salvar uma alteração Java, o Gradle recompila as classes e o Spring Boot DevTools reinicia a aplicação automaticamente.

## Configuração local

1. Copie `.env.example` para `.env` e preencha `POSTGRES_PASSWORD` com uma senha forte e exclusiva. O `.env` é ignorado pelo Git. O Compose exige uma senha não vazia e não fornece uma senha padrão.
2. Suba os serviços:

   ```bash
   docker compose up -d --build
   ```

O Compose passa `DATABASE_URL`, `POSTGRES_USER` e `POSTGRES_PASSWORD` para as variáveis `SPRING_DATASOURCE_*` do backend. Dentro do Compose, a URL usa `postgres:5432`; `POSTGRES_PORT` controla somente a porta exposta na máquina. Para executar o Java fora do Docker, defina `SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/finan` (ajustando porta e banco), `SPRING_DATASOURCE_USERNAME` e `SPRING_DATASOURCE_PASSWORD` no ambiente. O Spring Boot não carrega `.env` automaticamente.

O Flyway executa as migrations de `backend/src/main/resources/db/migration` durante a inicialização. A migration `V2__create_financial_transactions.sql` cria a tabela unificada de transações financeiras, com constraints de campos obrigatórios, valor positivo e enums. A entidade usa `MANUAL` como origem inicial e preenche os timestamps automaticamente. O Hibernate apenas valida o schema (`ddl-auto: validate`).

A migration `V1__initial.sql` preserva o marcador original da fundação. Bancos que já executaram essa V1 recebem a tabela pela V2 automaticamente; bancos novos executam ambas. Migrations já aplicadas devem ser preservadas, e mudanças de schema devem usar uma nova versão.

Os testes de persistência usam PostgreSQL e executam as migrations com `ddl-auto: validate`. Configure `SPRING_DATASOURCE_URL` para um banco de testes separado e vazio ao executar `./gradlew test`; os testes de repositório fazem rollback dos lançamentos.

Para verificar a inicialização e o histórico:

```bash
docker compose logs backend
docker compose exec postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT installed_rank, version, description, success FROM flyway_schema_history;"'
```

O log deve mostrar `Started FinanApplication` e o histórico deve conter as versões `1` e `2` com `success = true`. A API estará em `http://localhost:8080/api/transactions`, com os métodos POST e GET; a raiz pode retornar 404.

Os dados ficam no volume `postgres_data`. Alterar usuário, senha ou banco no `.env` não altera um banco já inicializado nesse volume.

## Próximos passos do MVP

1. Gerar a aplicação Angular.
2. Expandir as migrations conforme o domínio for implementado.
3. Modelar receitas, despesas e investimentos.
4. Criar os endpoints de cadastro e consulta.
5. Implementar o dashboard mensal.
6. Adicionar testes e validações.

## Integrações futuras

Os modos Pluggy/Open Finance e híbrido serão definidos após a conclusão do fluxo manual. A integração bancária deverá ser isolada do domínio financeiro para permitir que lançamentos importados e lançamentos manuais coexistam sem duplicidade.
