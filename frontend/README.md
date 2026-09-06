# Finan Web

Listagem Angular em http://localhost:4200/transactions, integrada ao GET
http://localhost:8080/api/transactions.

Execute na raiz do repositório, com o .env configurado:

```bash
docker compose up -d --build
```

Validação:

```bash
docker compose exec frontend npm run build
docker compose exec frontend npm test -- --watch=false
```

A tabela exibe descrição, valor em reais, data, tipo e origem. Recarregue a página
para consultar novos registros cadastrados no backend. O CORS do GET permite
http://localhost:4200.
