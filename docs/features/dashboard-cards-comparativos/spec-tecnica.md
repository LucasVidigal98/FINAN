# Cards comparativos do Dashboard — Spec Técnica

Status: implementação da [Spec](spec.md) concluída e validada em 19/09/2026; resultados em [Tasks](tasks.md).

## Base existente

- `frontend/src/app/dashboard/dashboard-comparison.model.ts`: `DashboardComparison`, `ComparisonMetrics` e `MetricComparison` já tipam períodos e as quatro métricas.
- `frontend/src/app/dashboard/dashboard.service.ts`: `getComparison(year, month)` consulta GET `/api/dashboard/comparison`; `getMonthlySummary` permanece disponível para o contrato legado.
- `frontend/src/app/dashboard/dashboard.component.ts`: seleção com FormsModule, signals de carregamento/erro/resumo e `loadSummary`; atualmente consulta somente o resumo mensal e não cancela consultas anteriores.
- `frontend/src/app/dashboard/dashboard.component.html`: seletores nativos, estado de carregamento, erro/retry, vazio que oculta cards e estrutura de saldo destacado mais três métricas.
- `frontend/src/app/dashboard/dashboard.component.scss`: superfícies #18181c, bordas #27272a, Inter/JetBrains Mono, verde #4ade80 e vermelho #f87171; layout ainda não atende quatro/duas/uma colunas.
- `frontend/src/app/dashboard/dashboard.component.spec.ts`: Vitest/TestBed com serviço simulado e Subject para estados assíncronos.
- `frontend/src/app/app.config.ts`: locale português já registrado; os pipes devem receber `pt-BR` explicitamente.

## Contrato e integração

Consumir `DashboardService.getComparison` no componente existente, trocando o signal de `MonthlySummary` por `DashboardComparison`. Não criar outro endpoint, serviço, componente genérico ou dependência. Referência: [contrato completo](../dashboard-comparativo/spec-tecnica.md).

| Rótulo | Campo de `metrics` | Valor | Diferença | Percentual |
| --- | --- | --- | --- | --- |
| Receitas | `income` | `current` | `absoluteChange` | `percentageChange` |
| Despesas | `expense` | `current` | `absoluteChange` | `percentageChange` |
| Saldo | `balance` | `current` | `absoluteChange` | `percentageChange` |
| Investimentos | `investment` | `current` | `absoluteChange` | `percentageChange` |

Reutilizar os tipos existentes e uma lista local tipada com chave/rótulo para renderizar quatro artigos. Não calcular saldo, diferença ou percentual a partir de `previous`; somente converter dados para apresentação. Remover dependência da contagem e do `availableBalance` no template, sem alterar contratos legados.

## Ciclo da consulta

Manter um único fluxo em `loadSummary`, com assinatura corrente cancelável e identificação do período em andamento:

1. Capturar ano/mês selecionados. Se já houver consulta ativa para o mesmo par, não duplicar.
2. Cancelar a assinatura anterior antes de iniciar o estado da nova consulta. Limpar resumo e erro; ativar carregamento.
3. Assinar uma única chamada `getComparison`. Cancelar também ao destruir o componente usando os recursos Angular/RxJS existentes.
4. Validar a resposta antes de expor os cards: períodos `YYYY-MM` válidos; quatro métricas presentes; campos monetários obrigatórios numéricos e finitos; percentual null ou número finito. Falha usa o mesmo estado de erro/retry, sem stack trace.
5. No sucesso da consulta vigente, definir seleção a partir de `currentPeriod` e publicar os dados juntos. Garantir que o ano retornado esteja entre as opções do seletor, incluindo-o se necessário; atribuição programática não deve disparar outra consulta.
6. No erro, manter resumo ausente e mensagem de falha com retry. Na conclusão, liberar a identificação da consulta e o carregamento; finalização de uma consulta cancelada não pode desligar o carregamento da nova.

O retry chama o mesmo fluxo com a seleção atual, mesmo que seja o mesmo período da tentativa que falhou. Sem cache, debounce obrigatório ou segunda consulta ao endpoint mensal. Cancelar a assinatura HTTP impede publicação obsoleta na interface; não pressupor reversão de processamento já iniciado no servidor, que mantém suas garantias existentes de FIXOs.

## Formatação e semântica

- Usar `CurrencyPipe` com `BRL`, `symbol`, `1.2-2`, `pt-BR` para atuais e módulo da diferença. Não aplicar módulo ao saldo atual.
- Usar `DecimalPipe` com `1.0-2`, `pt-BR`, seguido de `%`. O contrato já retorna pontos percentuais: 6.25 deve resultar em 6,25%, não 625%. Não usar PercentPipe diretamente nesse valor.
- Direção é o sinal de `absoluteChange`; aplicar `Math.abs` apenas à diferença exibida. Percentual preserva o sinal recebido, inclusive para base negativa.
- Diferença zero: valor de diferença zero, 0%, ícone neutro e frase exata “Sem alteração em relação ao mês anterior”. Null percentual: frase exata “Sem base de comparação”, preservando a diferença e direção da métrica.
- Mapear favorável/alerta a partir da direção e da chave `expense`: aumento de despesa é alerta e redução é favorável. Estabilidade é neutra. Aplicar essa semântica ao indicador de comparação, independentemente da cor de identificação da métrica.
- Montar “em relação a agosto de 2026” a partir de `previousPeriod` usando a lista de meses existente e o ano extraído. Não interpretar `YYYY-MM` como instante UTC nem calcular o mês anterior no navegador.
- Usar texto acessível “Aumento”, “Redução” ou “Sem alteração”; setas decorativas podem ter `aria-hidden`. Preservar labels dos seletores, foco visível e botão nativo de retry. Indicador de carregamento com `role="status"`, erro com `role="alert"` e região marcada ocupada durante a consulta.

## Layout e estados

Substituir a estrutura aninhada `.summary`/`.metrics` por uma grade única de quatro cards. Manter tokens e linguagem visual de `DESIGN.md`: fundo escuro, superfície, borda sutil, raio de 16px, padding de 24px e gap de 16px. Adaptar o destaque do saldo à mesma grade sem criar um quinto card.

Usar CSS Grid e media queries locais: uma coluna em telas pequenas, duas a partir de 48rem e quatro a partir de 80rem, ajustando se a largura útil da aplicação exigir. Testar também conteúdo longo e valores altos; evitar corte e rolagem horizontal. Permitir que seletores se reorganizem no celular.

Reutilizar o indicador de carregamento atual; skeleton não é obrigatório. Remover a ramificação `transactionCount === 0`: sucesso sempre renderiza os quatro cards, inclusive zero. Durante carregamento/erro não mostrar cards de uma resposta anterior.

## Validação e hipóteses

As quatro hipóteses da Spec se aplicam. Estender o teste existente com respostas controladas e interações reais nos seletores, preservando os testes HTTP do serviço. Normalizar espaços não separáveis em assertions monetárias quando necessário, sem perder sinal ou separadores.

| Cobertura | Verificação |
| --- | --- |
| CA01–CA02 | Quatro rótulos, BRL/pt-BR, -R$ 350,00, 6,25%, percentual inteiro e até duas casas, redução sem sinal monetário duplicado. |
| CA03 | Aumento, redução, igualdade; despesas invertidas; saldo -100 → -50 com diferença +50, percentual -50 e destaque favorável. |
| CA04 | Null em somente uma métrica, demais disponíveis; ambos os períodos zerados; atual vazio com anterior não vazio. |
| CA05 | Alteração de mês e ano consulta os parâmetros corretos; resposta sincroniza seletores sem nova consulta; janeiro referencia dezembro do ano anterior; incluir ano retornado fora da lista inicial. |
| CA06 | Subject pendente mostra carregamento e esconde dados antigos; erro e retry; A → B cancela A, apenas B aparece; repetição de B pendente não duplica; destruir cancela assinatura. |
| CA02, CA08 | Injetar NaN/Infinity nos campos numéricos simulados gera erro legível, sem valores técnicos no DOM; null válido não causa erro global. |
| CA07–CA08 | Inspeção visual em desktop/tablet/celular, valores longos, teclado e informação além da cor. |

Executar testes frontend, build e formatação conforme [Tasks](tasks.md). A entrega visual foi restrita ao Angular. O ajuste posterior do saldo para descontar investimentos também exige testes backend; resultados reais registrados em Tasks.

