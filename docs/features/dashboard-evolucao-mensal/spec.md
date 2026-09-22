# Evolução mensal do Dashboard — Spec

Status: proposta documentada em 21/09/2026; implementação pendente. Segue a convenção em português de `docs/features/fixo/`, `docs/features/dashboard-comparativo/` e `docs/features/dashboard-cards-comparativos/`: Spec, Spec Técnica e Tasks com critérios de aceite rastreáveis.

## Objetivo

Permitir que, ao selecionar um mês no Dashboard, o usuário visualize a evolução de Receitas, Despesas e Investimentos nesse mês e nos cinco anteriores, sem remover os cards comparativos existentes.

## Comportamento

- Exibir um gráfico de linhas com as séries Receitas, Despesas e Investimentos. Saldo não participa desta primeira versão.
- Usar o mês/ano selecionado como fim do intervalo e retornar exatamente seis competências consecutivas, da mais antiga à mais recente. Setembro de 2026 abrange abril a setembro de 2026; janeiro de 2026 atravessa a virada do ano e abrange agosto de 2025 a janeiro de 2026.
- Cada ponto representa a soma mensal já consolidada no backend: `INCOME` em receitas, `EXPENSE` em despesas e `INVESTMENT` em investimentos. O componente não soma transações brutas.
- Manter competências sem movimentação no gráfico com as três séries em zero. Uma série zerada em parte ou em todo o intervalo continua presente.
- Exibir meses abreviados em `pt-BR` no eixo horizontal, valores monetários no eixo vertical e tooltip com mês por extenso, ano e as três quantias em reais.
- Manter legenda textual visível. Diferenciar as séries por cor e traçado, sem depender somente da cor.
- Destacar o mês selecionado, que é a última competência do intervalo, por uma faixa/guia visual e pontos mais evidentes.
- O gráfico ocupa toda a largura disponível. Os seis meses permanecem legíveis no celular sem exigir rolagem horizontal e sem animações de entrada ou transições que atrapalhem a leitura.
- Disponibilizar nome acessível e resumo textual oculto com período, Receitas, Despesas e Investimentos de cada mês. Tooltip e alvos de cada competência funcionam por mouse, foco de teclado e toque.

## Período, atualização e estados

- Na entrada e a cada mudança de mês ou ano, consultar juntos os cards comparativos e a evolução do período selecionado.
- Uma seleção nova cancela a assinatura anterior e invalida suas respostas. Cards e gráfico só são publicados quando as duas respostas válidas correspondem ao mesmo mês selecionado.
- Durante o carregamento, remover cards e gráfico anteriores. Manter o indicador dos cards e apresentar um skeleton com altura aproximada do gráfico, ambos associados ao estado ocupado do Dashboard.
- Em sucesso, atualizar seletores, cards e gráfico de uma vez, usando o período confirmado pelo servidor.
- Se todos os 18 valores do intervalo forem zero, renderizar normalmente os seis meses e três séries na linha zero, acompanhados de “Nenhuma movimentação neste período”. Uma série apenas parcialmente ou totalmente zerada não caracteriza ausência geral de dados.
- Em erro de qualquer consulta ou resposta inválida, não exibir dados parciais ou antigos. Mostrar mensagem controlada e botão “Tentar novamente”, que solicita novamente o mês/ano atualmente selecionado.
- Nunca apresentar `NaN`, `Infinity`, `null`, `undefined`, pontos ausentes ou mensagem técnica. Uma resposta com períodos, quantidade de pontos ou números inválidos é tratada como erro recuperável.

## Hipóteses adotadas

1. A evolução terá contrato próprio em `GET /api/dashboard/evolution?year=&month=`, preservando os endpoints mensal e comparativo existentes.
2. Cards e gráfico usam um único ciclo de carregamento no componente. Se uma das duas consultas falhar, nenhum conjunto parcial é publicado; essa decisão privilegia a sincronização explícita solicitada.
3. O domínio vertical começa em zero, pois os totais mensais são somas de lançamentos de valor positivo. Quando todos os valores são zero, usa-se uma escala visual segura sem alterar os valores exibidos.
4. Tooltip de uma competência apresenta as três séries juntas. Em toque, ele permanece aberto até selecionar outra competência ou dispensá-lo; por teclado, foco e Escape controlam sua exibição.
5. O gráfico será SVG nativo e responsivo, sem nova dependência. As três séries usam as cores existentes do FINAN: verde para Receitas, vermelho para Despesas e azul para Investimentos, reforçadas por rótulo e traçado distintos.

## Critérios de aceite

- **CA01:** selecionar qualquer competência exibe exatamente seis meses consecutivos em ordem cronológica, terminando no mês selecionado e atravessando corretamente a virada do ano.
- **CA02:** cada ponto contém os totais corretos de receitas, despesas e investimentos consolidados no backend; saldo não é retornado nem desenhado.
- **CA03:** meses sem movimentação são retornados e desenhados com zero; série parcial ou totalmente zerada permanece visível, e somente o intervalo inteiramente zerado mostra a mensagem de ausência.
- **CA04:** eixo horizontal, eixo monetário e tooltip usam `pt-BR`; o tooltip identifica o mês completo e as três séries em reais, sem `NaN`, `Infinity` ou lacunas.
- **CA05:** trocar mês ou ano inicia novo carregamento, remove o gráfico anterior, consulta novamente cards e evolução e publica apenas respostas da seleção mais recente.
- **CA06:** carregamento exibe skeleton do gráfico; erro apresenta mensagem controlada e retry; retry usa a seleção atual e não reapresenta dados obsoletos.
- **CA07:** cards comparativos permanecem no Dashboard e são publicados em sincronia com o gráfico e o período confirmado pelo servidor.
- **CA08:** o gráfico é responsivo, ocupa a largura disponível, mostra os seis meses no celular sem rolagem horizontal obrigatória e oferece tooltip utilizável com mouse, teclado e toque.
- **CA09:** legenda, traçados e tooltip identificam textualmente as séries; o mês selecionado possui destaque que não depende só de cor e o contraste segue `DESIGN.md`.
- **CA10:** o gráfico possui nome acessível e resumo textual dos seis meses com as três quantias; testes automatizados validam conteúdo, ordem e formatação dessa alternativa.

## Fora de escopo e pontos a revisar

Sem série de saldo, filtro de quantidade de meses, zoom, rolagem horizontal obrigatória, exportação, animações elaboradas, novas dependências, migrations, distribuição por categoria ou trabalho de Pluggy. O endpoint comparativo e os cards existentes são preservados.

Não há questão bloqueante. As hipóteses acima ficam explícitas para revisão. A próxima etapa prevista após esta implementação é o gráfico de distribuição de despesas por categoria.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
