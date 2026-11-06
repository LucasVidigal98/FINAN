# Filtro por período das transações — Spec Técnica

Status: implementada; validação automatizada concluída e verificação visual manual pendente.

## Base existente

- `frontend/src/app/transactions/transaction-list.component.ts` carrega `Transaction[]` uma vez por `TransactionService.findAll()` e mantém a lista em `state`.
- `frontend/src/app/transactions/transaction-list.component.html` renderiza `state().transactions` na tabela e já possui estados de carregamento, erro e vazio.
- `frontend/src/app/transactions/transaction-list.component.spec.ts` usa TestBed, Vitest e serviços simulados; os testes verificam alterações de categoria/conta e exclusão sem recarregar.
- `frontend/src/app/transactions/transaction.ts` expõe `occurredOn` como string e o backend fornece datas no formato `yyyy-MM-dd`.
- `frontend/src/app/transactions/transaction.service.ts` consome `GET http://localhost:8080/api/transactions` sem parâmetros e deve permanecer inalterado.
- `frontend/src/app/dashboard/dashboard.component.ts` já usa `months`, ano atual, `new Date()` e controles `ngModel`; esse padrão deve orientar os seletores, sem criar componente compartilhado para apenas dois campos.
- `DESIGN.md` define fundo escuro, superfícies, bordas, espaçamento de 16px, controles com raio de 8px e foco visível.

## Implementação proposta

### Estado e derivação

Adicionar ao `TransactionListComponent`:

- lista de meses reutilizável, com os 12 nomes existentes no padrão do Dashboard;
- mês e ano selecionados, iniciados pelo mês/ano da data atual;
- opção nula ou equivalente para representar **Todos** em cada seletor;
- anos derivados da lista carregada, unidos ao ano atual e ordenados de forma decrescente;
- lista filtrada derivada de `state().transactions`, comparando `occurredOn.slice(0, 7)` com o período selecionado. O valor completo `yyyy-MM-dd` não deve ser convertido em `Date` para evitar deslocamento de fuso horário;
- indicador simples para distinguir vazio global de vazio no período selecionado.

O filtro deve ser uma derivação da lista completa. `addTransaction`, `replaceTransaction` e a remoção existente não devem ganhar caminhos paralelos: ao atualizar `state`, a lista filtrada deve se recalcular sozinha.

### Template e estilo

- Importar `FormsModule` no componente standalone para usar `[(ngModel)]` nos dois selects.
- Adicionar uma região de período antes do `.table-card`, com `aria-label` descritivo e um `<label>` explícito para **Mês** e outro para **Ano**.
- Usar `[ngValue]` para preservar números nos anos e o valor de **Todos** sem depender de conversões de string.
- Trocar o `@for` da tabela para iterar a lista filtrada. Manter `track transaction.id`, os selects e as ações existentes sem duplicação.
- Manter a mensagem de vazio dentro do `@empty`, variando apenas o texto conforme há filtro ativo.
- Criar estilos locais para a região de período, reutilizando os tokens visuais da tela e permitindo quebra dos controles em telas estreitas.

### Backend e contratos

Não alterar `TransactionController`, `TransactionService`, `FinancialTransactionRepository`, DTOs, migrations ou o endpoint existente. Não há consumidor adicional nem mudança de validação de negócio. A consulta completa continua necessária para que a opção **Todos** e os anos históricos funcionem.

## Validação proposta

Estender `frontend/src/app/transactions/transaction-list.component.spec.ts` com transações de pelo menos dois anos e meses distintos. Fixar a data do teste antes de criar o componente, para que o teste do período padrão não dependa do calendário real; restaurar o relógio ao fim de cada teste.

Cobrir:

| Cobertura | Verificação |
| --- | --- |
| CA01 | mês/ano atuais selecionados e somente as linhas do período atual visíveis |
| CA02 | troca de mês e ano exibe as linhas correspondentes |
| CA03 | **Todos** + **Todos** exibe o histórico completo e preserva a ordem |
| CA04 | mês sem ano e ano sem mês filtram corretamente, sem misturar períodos indevidos |
| CA05 | inclusão, alteração e exclusão atualizam a lista completa e respeitam o filtro |
| CA06 | mensagem de período vazio, mensagem de histórico vazio, carregamento e erro |
| CA07 | labels/controles presentes e uso por mudança de seleção |
| CA08 | `findAll` chamado somente uma vez; troca de filtros não chama o serviço novamente |

Executar os comandos da pasta `frontend`, conforme [Tasks](tasks.md): testes, build e Prettier nos arquivos alterados. Como não há mudança backend, não é necessário adicionar teste ou migration no backend para esta feature.
