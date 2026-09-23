# Despesas por categoria no Dashboard — Tasks

Status: implementação concluída em 22/09/2026; inspeção visual manual pendente. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md).

## 1. Consolidar despesas por categoria no backend (CA01–CA03)

- [x] Criar records de resposta e `GET /api/dashboard/expense-distribution?year=&month=` com `Cache-Control: no-store` e validação antes da materialização.
- [x] Reutilizar a obtenção do mês e o filtro de FIXOs inativos de `DashboardService.monthly`; agrupar somente `EXPENSE` por identidade da categoria, com grupo nulo “Sem categoria”.
- [x] Somar em `BigDecimal`, calcular percentuais com duas casas, ordenar por valor decrescente e desempate estável; devolver total zero e lista vazia sem despesas.
- [x] Testar filtros, categorias de mesmo nome com IDs distintos, categoria nula, percentuais/arredondamento, ordenação, mês vazio, parâmetros inválidos e igualdade com o card de Despesas, inclusive FIXOs ativos/inativos.

## 2. Integrar a seleção única do Dashboard (CA04–CA05)

- [x] Adicionar modelo frontend e `getExpenseDistribution(year, month)` ao serviço Angular, com teste de URL, parâmetros e erro.
- [x] Estender `loadSummary` para consultar comparação, evolução e distribuição no mesmo `forkJoin`; limpar os três dados ao mudar período e publicar apenas respostas válidas da seleção atual.
- [x] Validar período, itens, valores, percentuais e ordenação recebidos; rejeitar respostas incoerentes sem dados parciais. Reusar erro e retry do período selecionado.
- [x] Testar troca A → B com respostas fora de ordem, cancelamento, carregamento sem dados antigos, erro em qualquer chamada, resposta inválida, deduplicação pendente e retry.

## 3. Mostrar rosca acessível e estados (CA03, CA06)

- [x] Adicionar rosca SVG responsiva, total central e legenda ordenada com nome, valor BRL e percentual `pt-BR`, sem biblioteca nova e seguindo `DESIGN.md`.
- [x] Adicionar tooltip por mouse, foco e toque, Escape, foco visível, nome/descrição acessível e lista textual completa do período e das categorias.
- [x] Adicionar skeleton durante carregamento e “Nenhuma despesa neste mês” para lista vazia, sem rosca anterior ou divisão por zero.
- [x] Testar valores e percentuais, ordem, “Sem categoria”, tooltip, alternativa textual, mês vazio e erro/retry; inspeção visual manual pendente.

## 4. Validar entrega (CA01–CA06)

- [x] Executar testes backend em PostgreSQL isolado e vazio (`DashboardServiceTests` e `DashboardControllerTests`: 54 testes); executar frontend (`npm test -- --watch=false`: 71 testes) e `npm run build`.
- [x] Rodar Prettier nos arquivos frontend alterados e `git diff --check`; sem erros. O build reporta aviso de orçamento SCSS: `dashboard.component.scss` excede 4.00 kB por 990 bytes.
- [ ] Conferir manualmente mês com despesas → troca de período → carregamento sem dados antigos → mês vazio → erro/retry; inspeção visual e screenshots pendentes.
- [x] Atualizar o status destes três documentos com os resultados reais após implementação.

## Limites desta entrega

Sem Pluggy, migration, biblioteca de gráficos ou navegação por fatia. Depois da distribuição, a próxima etapa é o componente de maiores despesas do período.
