# Evolução mensal do Dashboard — Spec Técnica

Status: proposta de implementação da [Spec](spec.md); nenhum contrato ou gráfico descrito abaixo existe ainda.

## Base existente

- `backend/src/main/java/br/com/finan/dashboard/DashboardController.java`: expõe `GET /api/dashboard/monthly` e `GET /api/dashboard/comparison`, ambos com `Cache-Control: no-store`.
- `backend/src/main/java/br/com/finan/dashboard/DashboardService.java`: `monthly` valida a competência, materializa FIXOs, filtra lançamentos de FIXOs inativos e soma INCOME, EXPENSE e INVESTMENT com `BigDecimal`; `comparison` já reutiliza `monthly` para dois meses dentro de uma transação de escrita.
- `backend/src/main/java/br/com/finan/dashboard/MonthlySummaryResponse.java`: disponibiliza os três totais mensais necessários, além de saldo e contagem que não entram no novo contrato.
- `backend/src/main/java/br/com/finan/transaction/FinancialTransactionRepository.java`: a consulta atual por intervalo alimenta a consolidação mensal; não é necessário expor transações ao frontend.
- `frontend/src/app/dashboard/dashboard.service.ts`: centraliza as chamadas HTTP de Dashboard e já fornece `getComparison(year, month)`.
- `frontend/src/app/dashboard/dashboard.component.ts`: possui seletores, uma assinatura cancelável, identificador de requisição, validação de resposta, signals de carregamento/erro e publicação dos cards.
- `frontend/src/app/dashboard/dashboard.component.html` e `.scss`: contêm os quatro cards, estados acessíveis, tokens de `DESIGN.md`, grade responsiva e utilitário `.sr-only` reutilizável.
- `frontend/package.json`: Angular, RxJS e Vitest estão instalados; não há biblioteca de gráficos.

## Contrato proposto

Adicionar `GET /api/dashboard/evolution?year=2026&month=9` ao controller existente, com parâmetros obrigatórios numéricos e `Cache-Control: no-store`.

```json
{
  "startPeriod": "2026-04",
  "endPeriod": "2026-09",
  "points": [
    { "period": "2026-04", "income": 7000, "expense": 4100, "investment": 500 },
    { "period": "2026-05", "income": 7500, "expense": 3800, "investment": 700 },
    { "period": "2026-06", "income": 0, "expense": 0, "investment": 0 },
    { "period": "2026-07", "income": 0, "expense": 0, "investment": 0 },
    { "period": "2026-08", "income": 0, "expense": 0, "investment": 0 },
    { "period": "2026-09", "income": 0, "expense": 0, "investment": 0 }
  ]
}
```

No pacote `br.com.finan.dashboard`, adicionar somente os records `DashboardEvolutionPoint` (`period`, `income`, `expense`, `investment`) e `DashboardEvolutionResponse` (`startPeriod`, `endPeriod`, `points`). Períodos usam `YYYY-MM`; valores usam `BigDecimal` e são serializados como números JSON. Todos os campos são obrigatórios e a lista sempre contém seis pontos.

Adicionar `DashboardService.evolution(year, month)` com `@Transactional` de escrita:

1. Validar mês 1–12, ano 1–9999 e se os cinco meses anteriores permanecem nessa faixa antes de materializar qualquer FIXO. Assim, janeiro a maio do ano 1 retornam 400 sem escrita parcial.
2. Construir o período final com `YearMonth.of` e o inicial com `minusMonths(5)`, nunca subtraindo manualmente mês/ano.
3. Percorrer exatamente os seis `YearMonth` em ordem crescente e reutilizar `monthly` para obter cada consolidação. Mapear apenas `totalIncome`, `totalExpense` e `totalInvestment`; não retornar `availableBalance` nem `transactionCount`.
4. Criar um ponto mesmo quando os três totais forem zero. A ordem e o preenchimento vêm do intervalo gerado pelo backend, não dos lançamentos encontrados.
5. Manter uma única transação para os seis meses. Se materialização ou consolidação falhar em qualquer competência, reverter o conjunto e não retornar série parcial.

Essa implementação realiza seis consolidações e reaproveita a regra já testada de `monthly`, como `comparison` faz hoje para dois meses. É o menor caminho que evita divergência de FIXOs, filtros e totais. Uma consulta agrupada específica só deve substituir esse fluxo se medições futuras mostrarem custo relevante.

Nenhuma migration, dependência, cache ou alteração nos contratos mensal/comparativo é necessária.

## Integração Angular

Adicionar `frontend/src/app/dashboard/dashboard-evolution.model.ts` com `DashboardEvolutionPoint` e `DashboardEvolution`, refletindo exatamente o contrato. Adicionar `getEvolution(year, month): Observable<DashboardEvolution>` ao `DashboardService`.

Adaptar o ciclo existente de `DashboardComponent.loadSummary` sem criar outro componente ou serviço genérico:

1. Capturar o mês/ano selecionado, manter a deduplicação da mesma seleção pendente e cancelar a assinatura anterior.
2. Incrementar o identificador de requisição; limpar `comparison`, `evolution` e erro; ativar carregamento.
3. Usar `forkJoin` para uma chamada `getComparison` e uma `getEvolution`, ambas com os mesmos parâmetros. Manter `takeUntilDestroyed` e o `finalize` protegido pelo identificador atual.
4. Validar as duas respostas antes de publicar qualquer uma. Além das regras comparativas existentes, a evolução deve ter períodos válidos, seis pontos consecutivos e ordenados, primeiro/último ponto iguais a `startPeriod`/`endPeriod`, `endPeriod` igual a `currentPeriod` e valores numéricos finitos e não negativos.
5. No sucesso vigente, sincronizar os seletores a partir do período final comum e publicar cards/evolução juntos. No erro HTTP ou de validação, manter ambos ausentes e oferecer retry da seleção atual.

Cancelar a assinatura HTTP e conferir o identificador impede que uma resposta antiga altere dados, seleção, carregamento ou erro. `forkJoin` mantém o comportamento atômico sem adicionar estado intermediário ou consulta duplicada do mesmo endpoint.

## Gráfico e formatação

Renderizar o gráfico no template atual com SVG responsivo, `viewBox` e largura de 100%, sem pacote adicional. O componente recebe somente totais mensais; cálculos locais ficam restritos à apresentação:

- lista fixa das três séries com chave, rótulo, cor e padrão de traçado;
- máximo finito entre os 18 valores, domínio iniciado em zero e divisor visual seguro quando o máximo for zero;
- posições X igualmente distribuídas entre os seis pontos e posições Y derivadas da escala visual;
- linhas, pontos, grade e marcas monetárias; zero continua sendo um ponto válido;
- guia/faixa e pontos reforçados em `endPeriod` para destacar o mês selecionado.

Reutilizar `CurrencyPipe` para tooltip e resumo. Formatar competências sem criar datas UTC: separar ano/mês de `YYYY-MM` e usar `Intl.DateTimeFormat('pt-BR')` sobre uma data local para abreviação do eixo e nome completo no tooltip. O eixo vertical pode usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' })`; tooltip e alternativa textual mantêm reais completos com duas casas.

Sobrepor seis alvos nativos, um por competência, ao plot. Mouse, foco e toque selecionam o índice ativo e mostram um tooltip HTML com mês completo e as três séries. Cada alvo recebe nome acessível equivalente; Escape dispensa o tooltip e o foco permanece visível. A legenda textual mostra as três amostras de linha, inclusive traçados sólido/tracejado/pontilhado, para identificação além da cor.

Envolver o gráfico em `figure` com título/descrição associados e manter uma lista ou tabela `.sr-only` com os seis meses e valores. Não depender do conteúdo geométrico do SVG como única alternativa para leitor de tela.

## Estados, responsividade e estilo

- Durante `isLoading`, renderizar o estado atual dos cards e um skeleton do gráfico com dimensões aproximadas da área final; não manter SVG anterior no DOM.
- Em erro, usar `role="alert"` e o botão nativo “Tentar novamente”. O estado ocupado deve ser informado na região principal.
- Em sucesso totalmente zerado, renderizar gráfico, legenda e resumo, mais “Nenhuma movimentação neste período”. Detectar o estado somente com `every` sobre os pontos agregados; série isolada zerada não aciona a mensagem.
- Preservar fundo `#18181c`, borda `#27272a`, raio de 16px, textos claros, verde de Receitas, vermelho de Despesas e azul de Investimentos conforme os cards atuais. Garantir contraste de texto, linhas, foco e grade contra o fundo.
- Manter seis colunas de eixo dentro do SVG responsivo e reduzir apenas espaçamentos/tamanho de rótulo no celular. Não criar carrossel nem overflow horizontal.
- Evitar animação de linhas; no máximo, estados de hover/foco sem movimento da geometria.

## Validação e testes

As hipóteses da Spec se aplicam. Cobrir:

| Cobertura | Verificação |
| --- | --- |
| CA01–CA03 | Seis competências em ordem, abril–setembro e agosto–janeiro; somas dos três tipos; meses vazios e séries parcialmente zeradas. |
| CA01–CA02 | Validação de parâmetros antes de escrita; resposta sem saldo; FIXOs materializados nos seis meses conforme elegibilidade, inativos excluídos e rollback integral em falha. |
| CA04 | Abreviações, mês completo e BRL em `pt-BR`; rejeição de NaN, Infinity, negativos, lista incompleta, duplicada, fora de ordem ou com lacunas. |
| CA05–CA07 | Duas chamadas com os mesmos parâmetros; publicação atômica; troca de mês/ano; cancelamento A → B; conclusão antiga ignorada; deduplicação pendente; destruição e retry. |
| CA03, CA06 | Skeleton sem gráfico anterior, intervalo todo zerado com mensagem, série isolada zerada sem mensagem geral e erro controlado. |
| CA08–CA10 | Seis rótulos sem rolagem horizontal em desktop/tablet/celular; legenda/traçados; destaque final; tooltip por mouse, teclado e toque; nome e resumo acessíveis completos. |

Usar JUnit/AssertJ/MockMvc e PostgreSQL de testes no backend; Vitest/TestBed e respostas controladas no frontend. Executar os comandos e registrar resultados conforme [Tasks](tasks.md).
