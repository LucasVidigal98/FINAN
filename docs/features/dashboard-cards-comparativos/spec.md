# Cards comparativos do Dashboard — Spec

Status: implementado e validado em 19/09/2026; resultados e screenshots em [Tasks](tasks.md).

Segue a convenção em português de `docs/features/fixo/` e `docs/features/dashboard-comparativo/`: Spec, Spec Técnica e Tasks com critérios de aceite rastreáveis. Depende do [contrato comparativo implementado](../dashboard-comparativo/spec-tecnica.md).

## Objetivo

Selecionar um mês no Dashboard Angular e visualizar Receitas, Despesas, Saldo e Investimentos com valor mensal, diferença monetária e comparação com o mês imediatamente anterior.

## Comportamento

- Exibir os quatro cards na ordem Receitas, Despesas, Saldo e Investimentos. Cada um apresenta valor atual, diferença absoluta, percentual disponível, direção acessível e texto com o mês de comparação retornado pelo servidor.
- Usar reais em `pt-BR`, com duas casas decimais; percentuais com no máximo duas casas. Exemplo: Receitas, `R$ 8.500,00`, `↑ R$ 500,00 · 6,25%`, `em relação a agosto de 2026`.
- A diferença do contrato é assinada. Mostrar seu módulo monetário acompanhado de aumento ou redução, evitando seta de redução com sinal monetário negativo duplicado. Preservar o sinal do percentual recebido.
- Classificar direção pela diferença monetária: maior que zero é aumento, menor que zero é redução, zero é estabilidade. Não inferir direção pelo percentual.
- Para diferença zero, mostrar `R$ 0,00 · 0%` e a mensagem exata “Sem alteração em relação ao mês anterior”, além da identificação do mês comparado.
- Quando `percentageChange` for null, mostrar “Sem base de comparação” apenas no indicador daquela métrica. Manter valor, diferença, direção e demais cards disponíveis. Ambos os meses zerados representam estabilidade, não indisponibilidade.
- Nunca exibir NaN, Infinity, null, undefined ou mensagens técnicas. Valores numéricos inválidos não devem ser transformados em zero nem em ausência de base válida.
- Saldo negativo permanece negativo, por exemplo `-R$ 350,00`. O saldo deste contrato é receitas menos despesas menos investimentos; investimentos representam saída de dinheiro disponível no mês.

| Métrica | Aumento | Redução | Estabilidade |
| --- | --- | --- | --- |
| Receitas | Favorável | Alerta | Neutra |
| Despesas | Alerta | Favorável | Neutra |
| Saldo | Favorável | Alerta | Neutra |
| Investimentos | Favorável | Alerta | Neutra |

Ícones devem acompanhar texto visível ou nomes acessíveis de aumento, redução e estabilidade. Cor nunca é a única informação.

## Período e estados

- Consultar a comparação na entrada e ao mudar mês ou ano. Uma seleção dispara uma consulta comparativa, sem uma consulta adicional ao resumo legado.
- A seleção mais recente prevalece. Cancelar a assinatura da consulta anterior, evitar consultas duplicadas do mesmo período em andamento e manter seletor sincronizado com `currentPeriod` após sucesso.
- Durante a consulta, retirar valores anteriores e apresentar indicador de carregamento acessível. Não associar dados antigos ao período recém-selecionado.
- Em erro, mostrar mensagem compreensível e “Tentar novamente”, consultando a seleção atual. Não apresentar erro como mês vazio.
- Em sucesso, mostrar sempre os quatro cards, inclusive com valores atuais zerados. Um mês vazio pode ter diferenças não nulas se o anterior teve movimentações.
- Preservar o estilo escuro, tipografia, bordas e espaçamento do FINAN conforme `DESIGN.md`. Quatro colunas quando houver espaço em desktop, duas em tablet e uma em celular, sem perda de texto ou navegação por teclado.

## Hipóteses adotadas

1. Substituir os cards atuais pelos comparativos. O rótulo passa de “Saldo disponível” a “Saldo”; a contagem de movimentações sai desta região, pois não existe no novo contrato. Preservar a API mensal para outros consumidores.
2. Incluir o ano no texto do mês anterior em todos os cards para tornar a virada de ano explícita.
3. Preservar percentuais negativos do contrato mesmo quando a diferença aumenta: saldo de -100 para -50 mostra aumento de R$ 50,00 e -50%, com destaque favorável.
4. Uma resposta com números obrigatórios inválidos ou percentual não finito é erro de carregamento com retry. Null percentual válido continua sendo indisponibilidade individual.

## Critérios de aceite

- **CA01:** renderizar as quatro métricas a partir do contrato, inclusive Saldo com desconto de investimentos e saldo negativo.
- **CA02:** formatar dinheiro em pt-BR e percentuais com até duas casas; não duplicar sinal negativo da diferença nem apresentar valores técnicos.
- **CA03:** distinguir aumento, redução e estabilidade com ícone e informação acessível; aplicar cores invertidas às despesas e neutras à estabilidade.
- **CA04:** percentual null apresenta “Sem base de comparação” individual; diferença zero apresenta “Sem alteração em relação ao mês anterior”; mês vazio mantém os quatro cards.
- **CA05:** trocar mês ou ano atualiza os cards por uma consulta comparativa, sincroniza seleção com a resposta e identifica o mês anterior, inclusive janeiro/dezembro.
- **CA06:** carregamento esconde dados antigos, erro oferece retry, consultas obsoletas não sobrescrevem seleção/dados/estado e seleção repetida em andamento não duplica requisição.
- **CA07:** quatro/duas/uma colunas conforme espaço; preservar estilo, legibilidade, foco e uso por teclado.
- **CA08:** testes automatizados cobrem CA01–CA06, inclusive ausência de NaN/Infinity e saldo com base negativa; build e verificação visual responsiva aprovados.

## Fora de escopo e pontos a revisar

Sem gráficos, migrations, novas dependências, integração Pluggy ou recálculo financeiro no Angular. O ajuste posterior solicitado pelo usuário desconta investimentos do saldo no backend, mantendo a estrutura do contrato. A próxima tarefa será o gráfico de evolução mensal de receitas, despesas e investimentos.

Não há questão bloqueante. Hipóteses acima ficam explícitas para revisão. Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).

