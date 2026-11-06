# Filtro por período das transações — Spec

Status: implementada; verificação visual manual pendente.

Esta feature segue a convenção existente em `docs/features/`, com Spec, Spec Técnica e Tasks em português.

## Objetivo

Evitar que a tela `/transactions` apresente todo o histórico ao ser aberta. A listagem deve começar no mês atual e permitir consultar outro mês/ano ou remover o filtro para visualizar todas as transações.

## Comportamento

- Ao abrir `/transactions`, selecionar automaticamente o mês e o ano atuais da data local do navegador, seguindo o padrão de período já usado no Dashboard.
- Exibir controles acessíveis de **Mês** e **Ano** acima da tabela.
- Cada controle deve oferecer a opção **Todos**. Com ambos em **Todos**, a tabela mostra todas as transações.
- Com um controle em **Todos**, filtrar somente pelo outro: por exemplo, mês selecionado e ano em **Todos** mostra esse mês em todos os anos disponíveis.
- Com mês e ano selecionados, mostrar apenas transações cuja `occurredOn` pertença àquele período.
- Trocar o mês ou o ano deve atualizar a tabela imediatamente, sem nova chamada ao backend.
- O endpoint atual continua carregando a lista completa uma vez; o filtro é aplicado sobre os dados já carregados.
- Criação, edição de categoria/conta e exclusão continuam usando a lista completa. A tabela refletirá automaticamente o estado filtrado; uma transação fora do período selecionado não aparecerá até que o usuário altere o filtro.
- Quando não houver transações no período selecionado, informar que não há transações naquele período. Sem filtro e sem registros, informar que nenhuma transação foi cadastrada.
- Preservar os estados existentes de carregamento, erro, edição, exclusão, acessibilidade e responsividade.

## Hipóteses adotadas

1. O filtro será client-side, pois a API atual já retorna a lista completa, a tela não possui paginação e o pedido é uma interação da tabela. Uma API filtrada pode ser planejada depois se o volume justificar.
2. Os anos disponíveis serão o ano atual e os anos encontrados em `occurredOn`, ordenados do mais recente para o mais antigo. Assim, o ano atual continua selecionável mesmo sem transações.
3. O valor de `occurredOn` permanece uma data ISO `yyyy-MM-dd`; a comparação usará ano/mês da string, sem converter a data para UTC.
4. “Todos” em ambos os controles é a opção global para mostrar o histórico completo; combinações parciais continuam válidas.

## Critérios de aceite

- **CA01:** ao abrir `/transactions`, os controles começam no mês e ano atuais e a tabela mostra somente as transações daquele período.
- **CA02:** selecionar outro mês e/ou ano atualiza a tabela para o período escolhido sem recarregar a página ou chamar novamente `GET /api/transactions`.
- **CA03:** selecionar **Todos** nos dois controles mostra todas as transações, mantendo a ordenação atual.
- **CA04:** selecionar **Todos** em apenas um controle filtra pelo outro controle corretamente, inclusive quando existem transações do mesmo mês em anos diferentes.
- **CA05:** ao criar, editar ou excluir uma transação, a lista completa permanece consistente e a tabela respeita imediatamente o filtro ativo.
- **CA06:** períodos sem transações exibem estado vazio específico; carregamento e erro da consulta inicial continuam funcionando.
- **CA07:** os controles têm labels associados, foco visível e podem ser usados por teclado; o layout permanece utilizável em desktop e celular.
- **CA08:** testes automatizados cobrem período padrão, mudança de mês/ano, combinações com **Todos**, estado vazio e ausência de chamadas extras ao serviço.

## Fora de escopo

Não fazem parte desta entrega endpoint com parâmetros de período, paginação, ordenação nova, filtros por tipo/categoria/conta, alteração do Dashboard, persistência da seleção na URL ou armazenamento local, nem alteração do backend, banco ou contratos existentes.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
