# Dashboard comparativo — Spec

Status: implementado e validado em 19/09/2026; resultados em Tasks.

Segue a convenção em português de `docs/features/fixo/`: Spec, Spec Técnica e Tasks. Essa é a única feature com esse conjunto de documentos encontrada no repositório.

## Objetivo

Definir métricas e períodos para a comparação mensal do Dashboard antes de construir os cards comparativos e gráficos. As tarefas da Pluggy continuam pausadas.

## Comportamento

- O período principal é o mês/ano selecionado no Dashboard; o anterior é sempre o mês imediatamente anterior, inclusive na virada de ano.
- Considerar lançamentos pela data `occurredOn`, do primeiro ao último dia de cada mês. Comparar os meses completos com os registros disponíveis, sem proporcionalizar por dias decorridos.
- Receitas (`income`): soma de lançamentos INCOME; despesas (`expense`): soma de EXPENSE; total investido (`investment`): soma de INVESTMENT no mês, não patrimônio acumulado.
- Saldo (`balance`): receitas menos despesas menos investimentos. O valor investido sai do saldo disponível do mês.
- Cada métrica contém valor atual (`current`), anterior (`previous`), diferença assinada (`absoluteChange = current - previous`) e variação percentual (`percentageChange`). “Absoluta” indica diferença monetária, não módulo matemático.
- Com anterior diferente de zero: `percentageChange = ((current - previous) / previous) * 100`, arredondada para duas casas decimais, HALF_UP.
- Anterior e atual iguais a zero: `percentageChange = 0`. Anterior zero e atual diferente de zero: `percentageChange = null`, representando indisponibilidade. Nunca retornar NaN ou Infinity.
- Mês sem lançamentos tem as quatro métricas zeradas. Manter as regras atuais de elegibilidade, geração e exclusão de FIXOs inativos dos totais em ambos os períodos.

## Hipóteses adotadas

1. A fórmula percentual convencional usa o anterior com seu sinal também para saldo negativo: de -100 para -50, diferença +50 e percentual -50%. O percentual não classifica melhora/piora; essa interpretação visual fica para outra tarefa.
2. Valores monetários seguem a precisão existente; arredondar apenas o percentual ao final da divisão.
3. Manter o resumo mensal atual e seu `availableBalance` (receitas menos despesas menos investimentos). O `balance` comparativo reutiliza esse mesmo saldo disponível nos dois períodos, conforme ajuste solicitado pelo usuário.
4. A consulta comparativa materializa FIXOs elegíveis dos dois meses usando as regras existentes, sem gerar antecipadamente ou recuperar períodos fora da elegibilidade.

## Critérios de aceite

- **CA01:** consultar setembro de 2026 retorna `currentPeriod: "2026-09"` e `previousPeriod: "2026-08"`; janeiro de 2026 compara com dezembro de 2025.
- **CA02:** as quatro métricas retornam valores atuais, anteriores e diferenças corretas; investimento reduz `balance` nos dois períodos.
- **CA03:** aumento, redução e igualdade seguem as fórmulas, incluindo casas decimais e saldo negativo.
- **CA04:** anterior zerado produz 0% ou null conforme o atual; meses vazios funcionam e nenhuma resposta contém NaN ou Infinity.
- **CA05:** cálculo centralizado no backend, com DTOs próprios e tipos Angular correspondentes, sem aritmética nos componentes.
- **CA06:** testes automatizados de cálculos e contrato passam, cobrindo limites mensais, virada de ano, parâmetros inválidos e regras existentes de FIXOs; resumo atual permanece compatível.

## Fora de escopo e pontos a revisar

Sem gráficos, cards comparativos, mudanças de layout, integração Pluggy, patrimônio acumulado, comparações anuais ou escolha independente do período anterior. A próxima tarefa será criar os cards comparativos das quatro métricas.

Nenhuma questão bloqueante; as hipóteses acima foram preservadas na implementação. A consulta materializa FIXOs elegíveis dos dois meses em uma única transação, revertendo ambas as gerações se um período falhar.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
