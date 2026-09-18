# FIXO — Spec Técnica

Status: proposta de implementação da [Spec](spec.md); nenhum contrato novo abaixo existe ainda.

## Base existente

- `backend/src/main/java/br/com/finan/dashboard/DashboardController.java`: `GET /api/dashboard/monthly?year=&month=` chama `DashboardService.monthly`.
- `DashboardService.monthly` atualmente é `@Transactional(readOnly = true)` e soma `FinancialTransactionRepository.findAllByOccurredOnBetween`.
- `backend/src/main/java/br/com/finan/transaction/FinancialTransaction.java`: descrição, `BigDecimal amount`, `occurredOn`, tipo, origem e categoria/conta opcionais.
- `TransactionService.create`, `findCategory` e `findAccount` contêm o padrão atual de validação; categorias precisam estar ativas e ser do mesmo tipo. Criação manual usa origem `MANUAL`.
- `frontend/src/app/dashboard/dashboard.component.ts`: carrega o resumo na entrada e na seleção de mês; `monthly-summary.model.ts` já comporta os totais necessários.
- `frontend/src/app/app.routes.ts` e `frontend/src/app/app.html`: integrar rota e navegação. Usar a página de categorias como referência de formulário/lista e seguir `DESIGN.md`.
- Migrations existentes vão de V1 a V6. Preservá-las e manter `ddl-auto: validate`.

## Persistência proposta

Adicionar `V7__create_fixed_entries.sql` (rever o número se outra migration entrar antes).

Tabela `fixed_entries`:

| Campo | Regra |
| --- | --- |
| `id` | UUID, chave primária |
| `description` | varchar(150), obrigatório e não vazio |
| `amount` | numeric, obrigatório, maior que zero; Java `BigDecimal` |
| `type` | INCOME ou EXPENSE, obrigatório |
| `category_id` | FK obrigatória para categories |
| `starts_on` | date obrigatório; dia original da recorrência |
| `eligible_from` | date obrigatório; data local do cadastro ou última transição inativo → ativo |
| `active` | boolean obrigatório, padrão true |
| `created_at`, `updated_at` | timestamps no padrão das entidades existentes |

Adicionar `fixed_entry_id` (FK nullable) e `fixed_month` (date nullable, primeiro dia do mês) a `financial_transactions`. CHECK exige ambos nulos ou ambos preenchidos e mês normalizado; UNIQUE (`fixed_entry_id`, `fixed_month`) garante uma ocorrência por FIXO/mês. Transações antigas continuam sem vínculo. Não excluir em cascata.

Copiar descrição, valor, tipo e categoria para a transação; `occurred_on` recebe vencimento calculado, origem `MANUAL`, conta nula. Não recalcular lançamentos históricos a partir do modelo. O vínculo identifica a origem recorrente sem criar novo valor no enum compartilhado com contas.

## API proposta

Novo pacote `br.com.finan.fixedentry`, seguindo os controllers, services, DTOs e repositories existentes, sem motor genérico de recorrência.

| Método e rota | Entrada | Saída |
| --- | --- | --- |
| POST `/api/fixed-entries` | `description`, `amount`, `type`, `categoryId`, `startsOn` | 201, FIXO criado ativo |
| GET `/api/fixed-entries` | nenhuma | 200, lista incluindo inativos, ordenada por descrição e id |
| PATCH `/api/fixed-entries/{id}/active` | `{ "active": true/false }` | 200, estado persistido |

Resposta: `id`, campos do cadastro, `active`, `eligibleFrom`, `createdAt`, `updatedAt`. Datas locais em ISO `yyyy-MM-dd`; timestamps no padrão existente. Validar obrigatoriedade, descrição e valor no backend. Categoria desconhecida ou FIXO desconhecido: 404; dados inválidos, categoria inativa/incompatível: 400. Rejeitar INVESTMENT nesta feature. Adotar CORS existente para a interface local.

PATCH define o estado desejado, não inverte cegamente. Atualizar `eligible_from` somente em transição real de false para true. Ativação valida novamente categoria. Desativação permanece disponível mesmo se categoria estiver inválida. Serializar mudanças de estado da mesma linha com bloqueio de banco também usado pela geração.

## Aplicação mensal

Preservar o endpoint e o formato do resumo, conforme o gatilho solicitado pelo usuário. Seu GET passará a materializar lançamentos: documentar esse efeito e retornar `Cache-Control: no-store` para evitar respostas antigas sem avaliação do mês. Não criar agendador ou segunda chamada obrigatória no frontend.

1. Validar ano/mês antes de qualquer escrita, preservando os erros existentes.
2. Usar `Clock` injetável com zona `America/Sao_Paulo` para obter hoje e permitir testes determinísticos.
3. Em uma transação de escrita, buscar FIXOs ativos em ordem estável de id com bloqueio de linha; PATCH usa o mesmo bloqueio para ordenar geração e desativação concorrentes.
4. Para o mês consultado, calcular `vencimento = mês.atDay(min(startsOn.dayOfMonth, mês.lengthOfMonth()))`.
5. Aplicável se ativo e `vencimento >= startsOn`, `vencimento >= eligibleFrom` e `vencimento <= hoje`. Só processar esse mês, inclusive em consultas históricas; nenhuma antecipação.
6. Se já existe ocorrência para FIXO/mês, preservar e continuar. Caso contrário, validar categoria e inserir a transação com vínculo e competência.
7. Fazer flush antes de consultar e somar as transações usando a lógica existente. Retornar totais e contagem já atualizados.

Trocar `readOnly = true` por transação de escrita em `DashboardService.monthly` e delegar a geração ao serviço do novo pacote dentro da mesma transação. Bloqueios devem existir no PostgreSQL, não apenas na JVM. Com a ordem estável, a segunda consulta concorrente aguarda e verifica a ocorrência após a primeira confirmar. A constraint UNIQUE é a proteção final; não capturar violação e continuar numa transação marcada para rollback. Não usar `REQUIRES_NEW` por ocorrência.

Falha em qualquer inserção/validação reverte o lote inteiro e não retorna resumo de sucesso. Desativação concorrente é efetiva na ordem dos bloqueios: se a geração confirmar primeiro, preserva-se o lançamento; se a desativação confirmar primeiro, ele não é criado.

Limite conhecido: bloquear o conjunto ativo serializa consultas mensais concorrentes. É suficiente para o aplicativo pessoal atual; se houver contenção medida, restringir os bloqueios aos candidatos do mês sem perder a ordenação com PATCH e a garantia UNIQUE.

## Interface proposta

Adicionar `/fixed-entries` com rótulo **Fixos**, página e serviço sob `frontend/src/app/fixed-entries/`. Formulário com descrição, valor, tipo, categoria filtrada e campo nativo de data inicial; explicar “Repete todo mês no dia escolhido; em meses mais curtos, usa o último dia”. Lista mostra valor, categoria, dia, data inicial e estado, com botão Ativar/Desativar.

Reutilizar o serviço de categorias e padrões Angular de signals, FormsModule e HttpClient existentes. Bloquear envio/alternância durante requisição, atualizar somente após sucesso, preservar dados em falhas, oferecer nova tentativa. Sem categorias compatíveis, orientar cadastro em Categorias. Rótulos associados, navegação por teclado e estado textual além de cor. Aplicar tokens, espaçamento e responsividade de `DESIGN.md`.

Não alterar o DTO do resumo nem criar uma soma paralela de FIXOs no frontend. A listagem existente de transações os recebe como lançamentos normais; nenhuma alteração no saldo de contas é introduzida.

## Validação e hipóteses

Cobrir CA01–CA09 da Spec em testes backend JUnit/MockMvc com PostgreSQL para constraints, rollback e concorrência, e Vitest para formulário/estados. Usar relógio fixo para limites de data, ano bissexto e meia-noite local. Confirmar transações antigas e resumo sem FIXOs continuam funcionando.

Todas as hipóteses da Spec se aplicam: data obrigatória, último dia em meses curtos, apenas mês consultado, sem recuperação anterior ao cadastro/reativação, conta nula e origem MANUAL. Não há implementação de edição, exclusão, agenda ou investimento recorrente.
