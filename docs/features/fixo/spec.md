# FIXO — Spec

## Correções confirmadas em 17/09/2026

Estas regras substituem as restrições de exclusão e contabilização da proposta original abaixo:

- Excluir um FIXO ativo ou inativo remove também todos os seus lançamentos gerados, de qualquer mês. Lançamentos manuais e de outros FIXOs são preservados.
- Desativar bloqueia novas gerações e retira os lançamentos desse FIXO dos totais, saldo e contagem do dashboard em todos os meses, inclusive anteriores. Os registros continuam no histórico de transações.
- Reativar volta a incluir os lançamentos existentes no dashboard sem duplicá-los.

Status: proposta documentada; implementação pendente.

Não há specs de features no repositório. Esta feature inaugura a convenção `docs/features/<feature>/` com Spec, Spec Técnica e Tasks em português.

## Objetivo

Cadastrar uma vez receitas e despesas mensais, como salário, academia e assinaturas, evitando digitar o mesmo lançamento todo mês.

## Comportamento

- Cadastrar descrição, valor positivo, tipo (receita ou despesa), categoria compatível e data inicial prevista. O dia dessa data define a recorrência mensal. O FIXO nasce ativo.
- Listar FIXOs ativos e inativos e oferecer botão para ativar/desativar.
- Ao consultar o dashboard mensal, o backend verifica os FIXOs aplicáveis ao mês e cria transações reais antes de calcular o resumo.
- **Decisão confirmada pelo usuário:** gerar somente quando chegar o dia previsto. Não antecipar lançamentos futuros.
- Cada FIXO gera no máximo uma transação por mês, mesmo com recargas, requisições repetidas ou simultâneas.
- Os lançamentos gerados entram nos totais, saldo e contagem existentes e aparecem na listagem de transações.
- Desativar impede novas gerações; nunca apaga ou altera lançamentos anteriores.

## Hipóteses adotadas

Estas regras completam a proposta e não representam decisões explicitamente confirmadas pelo usuário:

1. A data inicial é obrigatória; não há FIXO sem dia definido. O valor também é obrigatório para gerar uma transação completa.
2. Dias 29, 30 e 31 caem no último dia quando o mês não possui esse dia. Não há ajuste por feriados ou finais de semana.
3. Só é processado o mês consultado. Um mês passado pode ser preenchido quando aberto, desde que o vencimento seja posterior ou igual à data inicial e ao cadastro/última reativação. Não há varredura de todos os meses ausentes.
4. Reativar reinicia a elegibilidade na data da reativação. Vencimentos anteriores a ela não são recuperados. Se reativar no próprio dia previsto, pode gerar naquele dia; um lançamento já existente impede duplicação.
5. A data atual é calculada no backend em `America/Sao_Paulo`.
6. Categoria é obrigatória no FIXO. Conta fica ausente, como já é permitido nas transações; pode ser vinculada ao lançamento pela interface existente.
7. A origem permanece `MANUAL`, pois o cadastro é manual; um vínculo próprio identifica qual FIXO gerou a transação.
8. Se a categoria estiver inativa ou incompatível na geração, o dashboard retorna erro explícito e nenhuma geração daquela consulta é persistida. Não deve apresentar totais incompletos como sucesso.

## Critérios de aceite

- **CA01:** criar e listar FIXO válido; rejeitar descrição vazia/maior que 150 caracteres, valor não positivo, data ausente, tipo não suportado e categoria ausente/inativa/incompatível/inexistente.
- **CA02:** FIXO com vencimento dia 10 não gera no dia 9; ao abrir o mês no dia 10 ou depois, gera uma transação com a data prevista, não com a data de acesso.
- **CA03:** abrir mês futuro não gera; mês anterior à elegibilidade não gera; abrir mês passado elegível gera somente a ocorrência daquele mês.
- **CA04:** recarregar ou consultar simultaneamente mantém uma única ocorrência, sem erro por disputa e sem dobrar totais.
- **CA05:** desativar preserva o histórico e bloqueia geração; reativar respeita as regras acima. Repetir a mesma solicitação de ativação não muda a elegibilidade.
- **CA06:** vencimento dia 31 gera em 30/04, 28/02 ou 29/02 de ano bissexto; março continua usando dia 31.
- **CA07:** receita aumenta o total de receitas e saldo; despesa aumenta gastos e reduz saldo; contagem inclui as novas transações. Investimentos existentes continuam iguais.
- **CA08:** falha de validação ou persistência não deixa lote parcial; o usuário vê erro e pode tentar novamente sem duplicar.
- **CA09:** tela oferece formulário, lista, estado ativo, ações acessíveis, carregamento, vazio e erro. Falha ao alternar não muda visualmente o estado salvo.

## Fora de escopo e pontos a revisar

Sem edição/exclusão do modelo nesta primeira entrega, investimentos recorrentes, parcelas, frequências diferentes de mensal, agendador, notificações, integração bancária ou confirmação de pagamento. O registro automático é um lançamento financeiro, não prova de pagamento bancário.

Não há pergunta bloqueante após a confirmação do gatilho por data. As hipóteses acima ficam explícitas para revisão, especialmente ausência de retroatividade anterior à reativação e data obrigatória.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
