# Dashboard comparativo — Spec Técnica

Status: implementação da [Spec](spec.md) concluída e testes aprovados em 19/09/2026. Resultados e ressalva de formatação em [Tasks](tasks.md).

## Base existente

- `backend/src/main/java/br/com/finan/dashboard/DashboardController.java`: GET `/api/dashboard/monthly?year=&month=`, com `Cache-Control: no-store`.
- `backend/src/main/java/br/com/finan/dashboard/DashboardService.java`: `monthly` valida ano/mês, materializa FIXOs, consulta `FinancialTransactionRepository.findAllByOccurredOnBetween`, exclui vínculos com FIXOs inativos e soma valores em BigDecimal. Já usa transação de escrita.
- `backend/src/main/java/br/com/finan/fixedentry/FixedEntryService.java`: `materialize(YearMonth)` aplica vencimento, elegibilidade e idempotência. Reutilizar a implementação vigente, inclusive o comportamento histórico.
- `frontend/src/app/dashboard/dashboard.component.ts`: `selectedYear`, `selectedMonth` e `loadSummary` definem a seleção atual.
- `frontend/src/app/dashboard/dashboard.service.ts` e `monthly-summary.model.ts`: serviço HTTP e contrato mensal existentes.
- `backend/src/test/java/br/com/finan/dashboard/DashboardControllerTests.java`: testes MockMvc com PostgreSQL para totais, mês vazio, isolamento de meses e parâmetros inválidos.

## API implementada

Adicionar GET `/api/dashboard/comparison?year=2026&month=9` ao controller existente, com `Cache-Control: no-store`. Os parâmetros obrigatórios seguem o formato numérico atual. O servidor determina o mês anterior; não aceitar um período anterior independente.

```json
{
  "currentPeriod": "2026-09",
  "previousPeriod": "2026-08",
  "metrics": {
    "income": { "current": 8500, "previous": 8000, "absoluteChange": 500, "percentageChange": 6.25 },
    "expense": { "current": 3000, "previous": 4000, "absoluteChange": -1000, "percentageChange": -25 },
    "balance": { "current": 5500, "previous": 4000, "absoluteChange": 1500, "percentageChange": 37.5 },
    "investment": { "current": 1000, "previous": 0, "absoluteChange": 1000, "percentageChange": null }
  }
}
```

Períodos são strings `YYYY-MM`. Campos monetários e percentual são números JSON, sem formatação monetária ou símbolo de porcentagem; `percentageChange` sempre está presente, mesmo quando null. Todos os outros campos são obrigatórios e não nulos.

No pacote dashboard, propor records `MetricComparison` (quatro BigDecimal, percentual nullable), `ComparisonMetrics` (income, expense, balance, investment) e `DashboardComparisonResponse` (duas strings de período e metrics). Não reutilizar `availableBalance` como saldo comparativo.

Validar ambos os períodos antes de materializar: mês entre 1 e 12, ano entre 1 e 9999, e período anterior dentro dessa faixa. Janeiro do ano 1 retorna 400; dezembro de 9999 é válido. Essa faixa mantém o formato de quatro dígitos. Parâmetro ausente/não numérico ou período inválido retorna 400, sem geração parcial. A validação adicional é do novo endpoint, sem mudar o contrato legado.

## Cálculo e integração

1. Adicionar `comparison(year, month)` no `DashboardService`, com `@Transactional` de escrita abrangendo os dois períodos. Construir `YearMonth` e usar `minusMonths(1)`, sem subtrair manualmente o número do mês.
2. Reutilizar `monthly` para obter os dois resumos dentro da transação externa, preservando materialização e filtros existentes. Não duplicar consultas/regras em outro serviço nem somar FIXOs diretamente. Se o segundo período falhar, reverter também as gerações do primeiro; não retornar comparação parcial.
3. Mapear `totalIncome`, `totalExpense` e `totalInvestment`. Calcular cada saldo a partir de `totalIncome.subtract(totalExpense)`.
4. Centralizar em um único método a construção de `MetricComparison`: diferença `current.subtract(previous)`; testar zero com `signum() == 0` ou `compareTo`, nunca com `equals` dependente de escala. Se anterior zero, retornar zero quando atual zero, senão null. Caso contrário, multiplicar a diferença por 100 e dividir pelo anterior com escala 2 e `RoundingMode.HALF_UP`.
5. Não converter valores para double durante o cálculo. Somar sem arredondamento intermediário e serializar como números JSON. Preservar o sinal do denominador para saldo negativo, conforme hipótese da Spec.

Nenhuma migration, dependência, cache ou alteração na integração Pluggy é necessária. A comparação herda o efeito de escrita na consulta de FIXOs; não usar `readOnly = true`.

## Tipos e serviço Angular implementados

Adicionar `frontend/src/app/dashboard/dashboard-comparison.model.ts`, com interfaces `MetricComparison` (`current`, `previous`, `absoluteChange`: number; `percentageChange`: number | null), `ComparisonMetrics` (as quatro propriedades tipadas) e `DashboardComparison` (`currentPeriod`, `previousPeriod`: string; `metrics`: ComparisonMetrics).

Adicionar `getComparison(year, month): Observable<DashboardComparison>` ao `DashboardService` Angular, usando HttpClient e os parâmetros selecionados. Nesta etapa, disponibilizar o serviço sem conectar novos cards ou alterar `DashboardComponent`, seu template ou o resumo existente. O consumidor futuro deve tratar null como indisponível, sem convertê-lo para zero ou recalcular percentuais. Seguir `DESIGN.md` quando implementar a próxima etapa visual.

## Validação e hipóteses

As hipóteses da Spec se aplicam integralmente. Usar JUnit/AssertJ já existentes para teste de serviço com colaboradores simulados e MockMvc/PostgreSQL para contrato e persistência. Adicionar testes HTTP do serviço Angular com Vitest e as ferramentas Angular existentes.

| Cenário de cálculo | Anterior | Atual | Diferença | Percentual |
| --- | ---: | ---: | ---: | ---: |
| Aumento | 8000 | 8500 | 500 | 6.25 |
| Redução | 100 | 80 | -20 | -20 |
| Igualdade | 100 | 100 | 0 | 0 |
| Ambos zerados | 0.00 | 0 | 0 | 0 |
| Base zero | 0 | 100 | 100 | null |
| Base zero e saldo negativo | 0 | -100 | -100 | null |
| Atual zero | 100 | 0 | -100 | -100 |
| Saldo negativo | -100 | -50 | 50 | -50 |
| Mudança de sinal | -100 | 100 | 200 | -200 |
| Arredondamento | 3 | 4 | 1 | 33.33 |
| Meio centésimo percentual | 32 | 33 | 1 | 3.13 |

Cobrir CA01–CA06: exemplo completo das quatro métricas; setembro/agosto; janeiro/dezembro; meses vazios; primeiro/último dia, fevereiro bissexto e exclusão de meses vizinhos; validação anterior à escrita. Verificar null explícito e ausência de valores não finitos no JSON. Confirmar FIXOs elegíveis nos dois meses, inativos fora dos totais, recarga sem duplicação e rollback se um período falhar. Manter os testes do endpoint mensal e dos componentes existentes.

Executar backend com banco PostgreSQL de testes separado e vazio, conforme AGENTS.md; não usar o banco pessoal. Comandos e checklist em [Tasks](tasks.md).
