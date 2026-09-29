# Maiores despesas no Dashboard — Spec Técnica

Status: implementada conforme [Spec](spec.md); validação frontend e teste unitário backend aprovados, integração backend pendente. Resultados em [Tasks](tasks.md).

## Base existente

- `DashboardService.transactions(YearMonth)` materializa FIXOs e exclui transações de FIXOs inativos; `expenseDistribution` já usa esse fluxo para `EXPENSE`.
- `DashboardController` expõe os endpoints mensais com `Cache-Control: no-store`.
- `DashboardComponent.loadSummary` consulta comparação, evolução e distribuição em `forkJoin`, cancela requisições anteriores, valida período/contratos, limpa dados antes de carregar e oferece retry.
- O template e SCSS existentes contêm cards, rosca, evolução, estados e tokens de `DESIGN.md`.

## Contrato e backend

`GET /api/dashboard/largest-expenses?year=2026&month=9` retorna `Cache-Control: no-store` e:

```json
{
  "period": "2026-09",
  "expenses": [
    { "id": "11111111-1111-4111-8111-111111111111", "description": "Aluguel", "amount": 2000, "occurredOn": "2026-09-05", "categoryName": "Sem categoria" }
  ]
}
```

`DashboardService.largestExpenses` valida ano 1–9999 e mês 1–12 antes de materializar. Reutiliza `transactions(period)`, filtra `EXPENSE`, ordena por `amount` decrescente, `occurredOn` decrescente e `id` crescente, limita a cinco e projeta `LargestExpense`. A categoria nula recebe “Sem categoria”; a consulta usa o nome da categoria mesmo se ela estiver inativa. Uma competência sem despesas devolve lista vazia. `BigDecimal` continua sendo o tipo monetário no backend. Nenhuma migration ou dependência é necessária.

## Integração Angular

`DashboardService.getLargestExpenses` recebe os mesmos `year`/`month` e um modelo tipado. `DashboardComponent.loadSummary` adiciona a chamada ao `forkJoin` existente, limpa o signal ao iniciar ou falhar e publica o resultado junto com comparação/evolução/distribuição somente após validar o período, a lista, os campos e a ordem. O cancelamento por assinatura e `requestId` existentes impedem resposta antiga. Retry reutiliza `loadSummary()`.

O template mostra seção com `h2`, competência e `<ol>`; cada linha contém os quatro campos solicitados. `CurrencyPipe` e `DatePipe` formatam valor/data. O estado de carregamento e erro é compartilhado com o Dashboard. SCSS reutiliza superfície/bordas do design existente e permite quebra de linhas no celular.

## Validação

| Critérios | Verificações |
| --- | --- |
| CA01–CA02 | Testes backend: tipo, FIXO inativo, categoria nula, ordem, limite e período inválido; contrato HTTP com data/valor e `no-store`. |
| CA03–CA04 | Testes frontend: URL/período, publicação da lista, vazio, cancelamento A → B, resposta antiga, erro de contrato e retry. |
| CA05 | Build, testes frontend, Prettier dos arquivos alterados e revisão visual quando o ambiente estiver disponível. |

Resultados reais e limitações de execução ficam em [Tasks](tasks.md).
