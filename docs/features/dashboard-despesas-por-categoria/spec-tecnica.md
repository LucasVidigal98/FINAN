# Despesas por categoria no Dashboard — Spec Técnica

Status: implementada conforme [Spec](spec.md); build e testes focados concluídos em 22/09/2026.

## Base existente

- `DashboardService.monthly` valida o período, materializa FIXOs e exclui transações vinculadas a FIXOs inativos antes de somar `EXPENSE` em `BigDecimal`.
- `FinancialTransactionRepository.findAllByOccurredOnBetween` já fornece as transações da competência. `FinancialTransaction.getCategory()` pode ser nulo; `Category` possui `id` e `name`.
- `DashboardController` expõe `/monthly`, `/comparison` e `/evolution` com `Cache-Control: no-store`.
- `DashboardComponent.loadSummary` usa `forkJoin`, cancela a assinatura anterior, invalida respostas por `requestId`, limpa os dados ao trocar o período e publica comparação/evolução juntas após validar os contratos.
- `DashboardService` Angular centraliza HTTP. O template já contém seletores, cards, gráfico de evolução, skeleton, erro/retry, `CurrencyPipe`, `DecimalPipe` e alternativa `.sr-only`. `DESIGN.md` define superfície, bordas, tipografia e cores. Não há biblioteca de gráficos instalada.

## Contrato proposto

Adicionar `GET /api/dashboard/expense-distribution?year=2026&month=9`, com parâmetros obrigatórios numéricos e `Cache-Control: no-store`.

```json
{
  "period": "2026-09",
  "totalExpense": 750,
  "categories": [
    { "categoryId": "9f0348dd-b8b8-4b96-b9db-804026bf3b52", "categoryName": "Mercado", "amount": 600, "percentage": 80.00 },
    { "categoryId": null, "categoryName": "Sem categoria", "amount": 150, "percentage": 20.00 }
  ]
}
```

Criar records de resposta no pacote `br.com.finan.dashboard` para `period`, `totalExpense` e lista de categorias; cada item contém `categoryId` (`UUID` ou `null`), `categoryName`, `amount` e `percentage` (`BigDecimal`). Período usa `YYYY-MM`; dinheiro e percentuais são números JSON. Sem despesas: `totalExpense: 0` e `categories: []`.

## Consolidação no backend

Adicionar método transacional a `DashboardService`, preservando os endpoints atuais:

1. Validar ano 1–9999 e mês 1–12 antes de materializar FIXOs. Reutilizar a obtenção de transações do mês e o filtro de FIXOs inativos de `monthly`, extraindo esse trecho para um método privado comum se necessário. Assim o novo total mantém a mesma regra do card de Despesas.
2. Filtrar apenas `TransactionType.EXPENSE`. Agrupar pela identidade de `getCategory().getId()`; categoria nula vai para o grupo nulo. Somar `amount` com `BigDecimal`. Usar o nome da categoria existente sem consultar apenas categorias ativas.
3. Somar os grupos para `totalExpense`. Se zero, devolver lista vazia. Caso contrário, calcular `amount * 100 / totalExpense` com escala 2 e `HALF_UP`, sem ajustes artificiais para fechar 100%.
4. Ordenar por `amount` decrescente, depois nome e identificador para desempate estável. A categoria nula tem nome de exibição “Sem categoria”. Manter grupos distintos mesmo se seus nomes coincidirem.

Não requer migration nem dependência. Testar que o total da distribuição coincide com `monthly.totalExpense` para o mesmo período, inclusive com FIXOs ativos e inativos.

## Integração Angular

Adicionar modelo tipado e `DashboardService.getExpenseDistribution(year, month)`. Estender `DashboardComponent.loadSummary` com a terceira chamada no `forkJoin` existente:

- Capturar os mesmos `year` e `month` para as três chamadas; preservar cancelamento, deduplicação pendente, `takeUntilDestroyed` e proteção por `requestId`.
- Ao iniciar, limpar também a distribuição; o gráfico anterior não permanece no DOM. Publicar os três conjuntos somente após `comparison.currentPeriod`, `evolution.endPeriod` e `distribution.period` coincidirem com a seleção solicitada.
- Validar `period`, `totalExpense` e itens: array, identificadores únicos (inclusive no máximo um nulo), nomes não vazios, números finitos/não negativos, ordem decrescente e soma dos valores igual ao total com tolerância apenas para representação numérica JSON. Percentuais devem corresponder aos valores dentro do arredondamento de duas casas. Falha de validação aciona o erro existente, sem publicação parcial.
- Botão de retry usa `loadSummary()` e portanto o mês/ano atualmente nos seletores. Reutilizar o estado único de carregamento e erro do Dashboard.

O frontend não soma transações; valida o contrato recebido e usa seus totais para desenhar a rosca.

## Gráfico, estados e acessibilidade

- Renderizar a rosca em SVG responsivo dentro de `figure`, usando as proporções prontas do contrato para arcos e um divisor visual seguro. O total no centro e a legenda usam valores do backend. A lista visível segue a ordem recebida; cada linha mostra nome, BRL e percentual.
- Usar `CurrencyPipe` e `DecimalPipe` com locale `pt-BR` já empregado no Dashboard. Exibir percentual com duas casas, inclusive zeros arredondados.
- Tooltip HTML com nome, valor e percentual da fatia ativa, acionável por hover, foco e toque/clique; Escape dispensa. Cada alvo tem nome acessível equivalente, foco visível e área utilizável em toque.
- Fornecer título/descrição associados à figura e lista `.sr-only` com mês/ano e todos os grupos com valor e percentual. Não depender do SVG ou da cor como única explicação.
- Enquanto carrega, mostrar skeleton da rosca ao lado do indicador já existente; em erro, usar o alerta e botão existentes. Para `categories: []`, mostrar “Nenhuma despesa neste mês”, sem rosca vazia, legenda de categorias ou tooltip.
- Seguir `DESIGN.md` e os breakpoints existentes para desktop e celular; manter contraste, texto legível e sem rolagem horizontal.

## Validação

| Critérios | Verificações |
| --- | --- |
| CA01–CA03 | API: filtro `EXPENSE`, agrupamento por ID/nulo, FIXOs, totais, percentuais, ordenação, empate, mês vazio e parâmetros inválidos. |
| CA04–CA05 | Frontend: três chamadas para a mesma seleção, limpeza imediata, A → B com resposta atrasada, erro de qualquer chamada, contrato inválido e retry do período atual. |
| CA03, CA06 | Renderização: BRL/percentual `pt-BR`, legenda/tooltip, alternativa textual, teclado/toque, foco, estado vazio, responsividade e ausência de valores `NaN`/`Infinity`. |

Executar testes backend contra PostgreSQL de testes separado e vazio, testes/build do frontend, Prettier nos arquivos alterados, `git diff --check` e inspeção visual em desktop/celular. Registrar resultados reais apenas durante a implementação.
