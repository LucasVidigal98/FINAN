# Evolução mensal do Dashboard — Tasks

Status: não iniciado. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md). Somente documentação foi produzida nesta etapa.

## 1. Entregar seis consolidações mensais no backend (CA01–CA03)

- [ ] Criar `DashboardEvolutionPoint` e `DashboardEvolutionResponse` no pacote dashboard, com períodos `YYYY-MM`, três valores `BigDecimal` e exatamente seis pontos.
- [ ] Implementar `DashboardService.evolution`: validar o intervalo completo antes de escrever, gerar competências com `YearMonth.minusMonths(5)`/`plusMonths`, reutilizar `monthly` em ordem cronológica e mapear somente receitas, despesas e investimentos.
- [ ] Expor GET `/api/dashboard/evolution?year=&month=` com `Cache-Control: no-store`, preservando os endpoints e contratos mensal/comparativo.
- [ ] Testar abril–setembro, agosto–janeiro, somas dos três tipos, ausência de saldo, meses totalmente vazios e série parcialmente zerada; afirmar seis pontos em todos os sucessos.
- [ ] Testar parâmetros ausentes/não numéricos, mês 0/13, ano fora de 1–9999 e intervalo anterior ao ano 1, sem materialização parcial.
- [ ] Testar FIXOs elegíveis nos seis meses, exclusão dos inativos, recarga sem duplicação e rollback integral quando uma competência falhar.

## 2. Carregar cards e evolução como uma seleção única (CA05–CA07)

- [ ] Criar `dashboard-evolution.model.ts` e `DashboardService.getEvolution(year, month)`; testar método, URL, parâmetros, resposta tipada e propagação de erro.
- [ ] Adaptar `loadSummary` para combinar comparação e evolução com `forkJoin`, reutilizando assinatura cancelável, deduplicação, `takeUntilDestroyed`, identificador e retry existentes.
- [ ] Limpar cards e evolução ao iniciar uma seleção e publicar ambos somente quando `comparison.currentPeriod` e `evolution.endPeriod` coincidirem; sincronizar os seletores sem nova consulta.
- [ ] Validar seis pontos consecutivos, limites do contrato e números finitos/não negativos antes de expor dados; rejeitar lista incompleta, duplicada, fora de ordem, com lacunas ou período divergente.
- [ ] Testar carregamento inicial e troca real de mês/ano, duas chamadas com os mesmos parâmetros, A → B cancelando A, resposta antiga ignorada, seleção pendente deduplicada, destruição, erro e retry da seleção atual.

## 3. Renderizar o gráfico responsivo e acessível (CA03–CA04, CA08–CA10)

- [ ] Adicionar ao Dashboard o SVG nativo responsivo com grade, eixo monetário, seis rótulos abreviados, três linhas/pontos e destaque do período final; não adicionar dependência nem calcular totais de transações no frontend.
- [ ] Incluir legenda textual e traçados distintos para Receitas, Despesas e Investimentos, preservando as cores e o contraste de `DESIGN.md` sem depender somente delas.
- [ ] Implementar tooltip HTML por competência com mês completo e três valores em BRL/pt-BR, acionável por mouse, foco, teclado e toque; permitir dispensar com Escape.
- [ ] Adicionar nome/descrição do gráfico e resumo `.sr-only` com os seis meses e as três quantias; manter foco visível nos seis alvos interativos.
- [ ] Renderizar skeleton durante carregamento, sem gráfico anterior; em intervalo totalmente zerado, manter linhas/pontos em zero e mostrar “Nenhuma movimentação neste período”; não tratar série isolada zerada como vazio.
- [ ] Testar ordem/rótulos, BRL e meses pt-BR, destaque final, legenda, tooltip, zeros, escala sem NaN/Infinity e resumo acessível completo.

## 4. Validar integração e entrega (CA01–CA10)

- [ ] Executar os testes backend com PostgreSQL separado e vazio: `docker compose run --rm backend ./gradlew test`; não usar o banco pessoal.
- [ ] Executar `docker compose exec frontend npm test -- --watch=false` e `docker compose exec frontend npm run build`.
- [ ] No ambiente frontend, executar `npx prettier --check "src/**/*.{ts,html,scss}"`; se houver pendência preexistente, validar separadamente todos os arquivos alterados.
- [ ] Executar `git diff --check` e confirmar que nenhuma migration ou dependência foi adicionada.
- [ ] Inspecionar desktop, tablet e celular: seis meses sem rolagem horizontal, valores longos, intervalo zerado, série parcial, destaque selecionado, contraste, teclado e tooltip por toque; registrar screenshots para revisão.
- [ ] Validar manualmente mês/ano → skeleton sem dados antigos → cards e gráfico sincronizados → troca com virada de ano → erro/retry, registrando comandos e resultados reais antes de atualizar o status dos três documentos.

## Limites desta entrega

Sem saldo no gráfico, quantidade configurável de meses, zoom, exportação, animação elaborada, biblioteca de gráficos, migrations, distribuição por categoria ou Pluggy. O endpoint mensal, o comparativo e os quatro cards permanecem.

As hipóteses documentadas são: endpoint próprio, publicação atômica de cards/gráfico, eixo iniciado em zero, tooltip conjunto por competência e SVG nativo. Não há questão bloqueante aberta. Próxima etapa: gráfico de distribuição de despesas por categoria.
