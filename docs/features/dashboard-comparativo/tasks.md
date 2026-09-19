# Dashboard comparativo — Tasks

Status: implementação concluída; 111 testes backend e 42 testes frontend aprovados em 19/09/2026. Build aprovado; formatação dos arquivos alterados aprovada, com pendências preexistentes no restante do frontend. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md).

## 1. Consultar comparação mensal no backend (CA01–CA04, CA05)

- [x] Criar records `MetricComparison`, `ComparisonMetrics` e `DashboardComparisonResponse` no pacote dashboard, com percentual nullable sempre presente no JSON.
- [x] Implementar `DashboardService.comparison` e GET `/api/dashboard/comparison?year=&month=` com no-store; validar parâmetros e faixa dos dois períodos antes de qualquer geração, usar `YearMonth.minusMonths(1)`.
- [x] Reutilizar `monthly` em uma transação de escrita externa para ambos os meses. Preservar FIXOs e o endpoint mensal; calcular `balance` como receitas menos despesas, sem descontar investimento.
- [x] Centralizar diferença e percentual em BigDecimal; tratar zero independentemente da escala, usar denominador com sinal e HALF_UP com duas casas apenas no percentual final.
- [x] Adicionar testes de serviço para todos os casos da tabela técnica: aumento, redução, igualdade, zeros, saldo negativo, mudança de sinal e arredondamento.

## 2. Verificar contrato e períodos persistidos (CA01–CA04, CA06)

- [x] Estender `DashboardControllerTests` com o exemplo completo das quatro métricas, setembro/agosto e janeiro/dezembro do ano anterior.
- [x] Testar limites inclusivos dos meses, fevereiro bissexto, exclusão dos meses vizinhos, mês anterior vazio, atual vazio e ambos vazios; afirmar valores, diferenças, percentuais e null explícito sem NaN/Infinity.
- [x] Testar parâmetros ausentes/não numéricos, meses 0/13, anos fora de 1–9999 e janeiro do ano 1: HTTP 400 sem materialização; confirmar dezembro de 9999 válido.
- [x] Testar FIXOs elegíveis nos dois períodos, exclusão de inativos, recarga sem duplicação e rollback integral quando um período falhar; preservar testes do resumo mensal legado.

## 3. Disponibilizar contrato tipado no Angular (CA05, CA06)

- [x] Criar `dashboard-comparison.model.ts` com `MetricComparison`, `ComparisonMetrics` e `DashboardComparison`, refletindo todos os campos e `percentageChange: number | null`.
- [x] Adicionar `getComparison(year, month)` ao serviço HTTP existente, sem cálculos no frontend nem alterações visuais. Seleção e ligação aos novos cards ficam para a próxima tarefa.
- [x] Testar URL, parâmetros, resposta tipada com as quatro métricas, preservação de null e propagação de erro usando os recursos de teste Angular existentes.

## 4. Validação e entrega (CA01–CA06)

- [x] Com conexão direcionada a um PostgreSQL de testes separado e vazio, executar `docker compose run --rm backend ./gradlew test`.
- [x] Executar `docker compose exec frontend npm test -- --watch=false` e `docker compose exec frontend npm run build`.
- [x] No frontend, verificar formatação com `npx prettier --check "src/**/*.{ts,html,scss}"`.
- [x] Registrar comandos/resultados reais e atualizar o status destes documentos somente após os testes passarem; documentar o efeito de geração de FIXOs nos dois meses.

## Resultados da validação — 19/09/2026

O backend foi testado em um contêiner PostgreSQL 16 temporário, inicialmente vazio, sem volumes, com banco `finan_comparison_test`. O banco pessoal não foi usado. Os serviços frontend/backend estavam parados; por isso foi usado `compose run --rm --no-deps` em vez de `compose exec`.

| Comando executado | Resultado |
| --- | --- |
| `docker compose run --rm --no-deps -e SPRING_DATASOURCE_URL=jdbc:postgresql://finan-comparison-test-db:5432/finan_comparison_test -e SPRING_DATASOURCE_USERNAME=finan_test -e SPRING_DATASOURCE_PASSWORD=<senha-temporaria> backend ./gradlew test --no-daemon` | Exit 0; 111 testes, zero falhas/erros/ignorados. Senha descartável omitida do registro. |
| `docker compose run --rm --no-deps frontend npm test -- --watch=false` | Exit 0; 42 testes em 9 arquivos. |
| `docker compose run --rm --no-deps frontend npm run build` | Exit 0; build de produção aprovado. |
| `docker compose run --rm --no-deps frontend npx prettier --check "src/**/*.{ts,html,scss}"` | Exit 1; 45 arquivos preexistentes fora desta mudança precisam de formatação. |
| `docker compose run --rm --no-deps frontend npx prettier --check src/app/dashboard/dashboard-comparison.model.ts src/app/dashboard/dashboard.service.ts src/app/dashboard/dashboard.service.spec.ts` | Exit 0; os três arquivos alterados estão formatados. |
| `git diff --check` | Exit 0. |

O GET comparativo materializa FIXOs elegíveis primeiro no mês anterior e depois no atual, dentro de uma transação de escrita. Os testes confirmam ausência de duplicação, exclusão de inativos, respeito à elegibilidade e rollback integral quando a materialização do segundo período falha. Nenhuma migration ou dependência foi adicionada.

## Escopo preservado

Hipóteses: total investido é fluxo mensal; percentual usa anterior com sinal; arredondamento HALF_UP; meses completos com dados disponíveis; saldo comparativo distinto de `availableBalance`. Não há questão bloqueante aberta.

Pluggy permanece pausada. Sem gráficos, cards comparativos, novos componentes, migrations ou dependências nesta etapa. Próxima tarefa: criar os cards comparativos das quatro métricas.
