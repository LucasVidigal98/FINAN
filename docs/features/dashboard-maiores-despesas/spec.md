# Maiores despesas no Dashboard — Spec

Status: implementada em 23/09/2026; testes frontend, build e teste unitário backend aprovados. Teste de integração backend e inspeção visual pendentes. Resultados em [Tasks](tasks.md).

## Objetivo

Mostrar, em seção dedicada do Dashboard, os maiores lançamentos de despesa do mês/ano selecionado, para identificar rapidamente os gastos de maior valor.

## Comportamento

- Mostrar até cinco transações `EXPENSE` do período, ordenadas por valor decrescente. Em empate, usar data mais recente e identificador para manter ordem estável.
- Exibir descrição, valor em BRL/pt-BR, data e categoria. Categoria ausente aparece como “Sem categoria”.
- Seguir a regra existente de FIXOs: materializar os elegíveis e excluir lançamentos vinculados a FIXOs inativos.
- Usar os seletores de mês e ano existentes. Na troca de período, limpar o conteúdo anterior, mostrar carregamento e publicar a lista somente junto com cards e os dois gráficos da mesma seleção.
- Em mês sem despesas, mostrar “Nenhuma despesa neste mês”. Em erro HTTP ou resposta inválida, mostrar erro controlado e “Tentar novamente” para a seleção atual.
- Manter a seção legível no celular, com título, lista semântica e foco/seletores acessíveis conforme `DESIGN.md`.

## Hipóteses adotadas

1. “Maiores despesas” significa os cinco maiores lançamentos individuais, não categorias agregadas. Cinco mantém a seção compacta; não há paginação solicitada.
2. A ordenação e o limite são aplicados pelo backend, reutilizando o filtro comum de FIXOs do Dashboard. O componente não carrega transações brutas para ordenar.
3. Lista, cards e gráficos compartilham o ciclo de carregamento já existente; se qualquer resposta falhar, o Dashboard mostra erro e permite retry.

## Critérios de aceite

- **CA01:** somente despesas `EXPENSE` da competência selecionada aparecem, incluindo FIXOs elegíveis e excluindo FIXOs inativos; no máximo cinco itens são devolvidos.
- **CA02:** itens vêm por valor decrescente, com desempate estável, e mostram descrição, valor, data e categoria ou “Sem categoria”.
- **CA03:** trocar mês/ano remove a lista anterior imediatamente e ignora respostas antigas; lista, cards e os dois gráficos pertencem à mesma seleção.
- **CA04:** carregamento, mês vazio, erro controlado e retry da seleção atual são apresentados sem dados obsoletos.
- **CA05:** a seção é responsiva, usa lista e título semânticos, formatação `pt-BR` e segue a linguagem visual de `DESIGN.md`.

## Fora de escopo e pontos a revisar

Sem paginação, navegação para detalhe, filtro adicional, Pluggy, nova dependência ou migration. Os cards comparativos e os dois gráficos existentes são preservados. A validação integrada deles fica para a etapa posterior indicada pelo usuário.

Não há questão bloqueante. Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
