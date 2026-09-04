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

- Node.js e npm
- Angular CLI
- Java 21
- Maven ou Maven Wrapper
- Docker e Docker Compose

## Configuração local

1. Copie `.env.example` para `.env` e ajuste os valores, se necessário.
2. Suba o banco de dados:

   ```bash
   docker compose up -d postgres
   ```

3. Inicialize o frontend e o backend dentro de seus respectivos diretórios quando os projetos forem gerados.

## Próximos passos do MVP

1. Gerar a aplicação Angular.
2. Gerar a aplicação Spring Boot com Java 21.
3. Configurar a conexão com PostgreSQL e as migrações.
4. Modelar receitas, despesas e investimentos.
5. Criar os endpoints de cadastro e consulta.
6. Implementar o dashboard mensal.
7. Adicionar testes e validações.

## Integrações futuras

Os modos Pluggy/Open Finance e híbrido serão definidos após a conclusão do fluxo manual. A integração bancária deverá ser isolada do domínio financeiro para permitir que lançamentos importados e lançamentos manuais coexistam sem duplicidade.

