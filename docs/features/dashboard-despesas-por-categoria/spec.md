# Despesas por categoria no Dashboard — Spec

Status: implementada em 22/09/2026; inspeção visual manual pendente.

## Objetivo

Permitir que o usuário veja como o total de despesas do mês/ano selecionado no Dashboard se distribui entre categorias, em valores e percentuais.

## Comportamento

- Exibir um gráfico de rosca para transações `EXPENSE` da competência selecionada. `INCOME` e `INVESTMENT` não participam.
- Agrupar despesas pela identidade da categoria. Lançamentos com categoria nula formam a fatia “Sem categoria”.
- Exibir cada categoria com valor em reais e percentual do total de despesas, em ordem decrescente de valor. A legenda também apresenta esses dados; o tooltip identifica a fatia apontada ou focada.
- Usar os mesmos seletores de mês e ano dos cards e da evolução. A consolidação acontece no backend; o Angular recebe totais e percentuais prontos, sem agregar transações.
- Ao trocar o período, remover imediatamente os dados anteriores, mostrar carregamento e descartar respostas antigas. Publicar cards, evolução e distribuição somente para a mesma seleção válida.
- Se o mês não tiver despesas, mostrar “Nenhuma despesa neste mês” no lugar da rosca e da legenda de categorias. Cards e evolução continuam disponíveis.
- Em falha de consulta ou resposta inválida, apresentar mensagem legível e botão “Tentar novamente”, que recarrega a seleção atual sem exibir dados antigos ou parciais.
- Formatar moeda e percentuais em `pt-BR`. Dar nome acessível ao gráfico e oferecer uma lista textual com período, categoria, valor e percentual para cada fatia. Tooltip deve funcionar com mouse, teclado e toque; foco visível e operação sem depender só da cor.

## Hipóteses adotadas

1. O novo endpoint mensal é `GET /api/dashboard/expense-distribution?year=&month=`, sem alterar os contratos existentes.
2. A distribuição segue a mesma regra do resumo mensal: FIXOs elegíveis são materializados e lançamentos de FIXOs inativos não entram. Categorias atualmente inativas continuam identificando despesas históricas já contabilizadas.
3. O backend calcula percentuais com duas casas decimais. Arredondamentos independentes podem fazer a soma exibida diferir de 100% em 0,01 ponto; os valores monetários permanecem a fonte do total.
4. Categorias diferentes com o mesmo nome continuam separadas pela identidade. Empates no valor são ordenados por nome e identificador; “Sem categoria” usa uma identidade nula própria.
5. A rosca pode usar SVG nativo e cores da interface, sem biblioteca nova. Rótulos e valores textuais acompanham as cores.

## Critérios de aceite

- **CA01:** selecionar mês e ano exibe apenas despesas `EXPENSE` desse mês, inclusive lançamentos elegíveis de FIXOs, com soma por categoria e total correspondente ao card de Despesas.
- **CA02:** transações sem categoria aparecem em “Sem categoria”; categorias com mesmo nome e identidades diferentes não são somadas juntas; receitas e investimentos não aparecem.
- **CA03:** cada categoria mostra valor e percentual do total em `pt-BR`, ordenada da maior despesa para a menor, com desempate estável. O mês sem despesas mostra o estado vazio, sem divisão por zero.
- **CA04:** trocar mês ou ano remove imediatamente a rosca anterior, mostra carregamento, ignora respostas antigas e publica cards, evolução e distribuição apenas quando os três resultados correspondem ao período selecionado.
- **CA05:** erro HTTP ou resposta inválida não deixa dados antigos ou parciais visíveis; “Tentar novamente” consulta o período atual.
- **CA06:** rosca responsiva, tooltip e legenda identificam categorias, valores e percentuais; o conteúdo é utilizável com mouse, teclado e toque, possui alternativa textual completa e não depende somente de cor.

## Fora de escopo e pontos a revisar

Sem filtro por categoria, seleção de fatias para navegar, comparação entre meses, exportação, nova dependência, migration ou trabalho Pluggy. A próxima etapa depois deste gráfico é o componente de maiores despesas do período.

Não há questão bloqueante. As hipóteses acima ficam explícitas para revisão.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
