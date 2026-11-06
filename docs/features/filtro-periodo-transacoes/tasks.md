# Filtro por período das transações — Tasks

Status: implementação e validação automatizada concluídas; verificação visual manual pendente.

## 1. Filtrar a lista pelo período (CA01–CA05)

- [x] Adicionar ao `TransactionListComponent` os estados de mês/ano, o padrão no período atual, a opção **Todos** e os anos derivados das transações carregadas.
- [x] Derivar a lista visível por `occurredOn`, suportando mês e ano independentes, sem converter datas ISO para UTC e sem alterar `findAll`.
- [x] Confirmar que criação, atualização de categoria/conta e exclusão continuam atualizando somente a lista completa, da qual a tabela filtrada é derivada.

## 2. Integrar controles e estados da tabela (CA02, CA03, CA04, CA06, CA07)

- [x] Adicionar selects acessíveis de Mês e Ano antes da tabela, com labels, **Todos**, foco visível e atualização imediata por `ngModel`.
- [x] Aplicar estilos responsivos coerentes com `DESIGN.md`, sem duplicar componente compartilhado ou alterar a estrutura existente da tabela.
- [x] Diferenciar “Nenhuma transação encontrada neste período” de “Nenhuma transação cadastrada”, preservando carregamento, erro e ações existentes.

## 3. Testar o comportamento (CA01–CA08)

- [x] Fixar o relógio nos testes do componente e preparar transações de meses e anos diferentes.
- [x] Testar período atual, troca de mês/ano, combinações parciais com **Todos**, histórico completo e estados vazios.
- [x] Testar que cadastro, edição e exclusão permanecem consistentes sob filtro e que `findAll` não é chamado novamente ao trocar seleções.
- [x] Testar labels e renderização dos controles sem quebrar os testes existentes de categoria, conta e exclusão.

## 4. Validação integrada e entrega (CA01–CA08)

- [x] Executar `npm test -- --watch=false` na pasta `frontend`: 11 arquivos e 97 testes aprovados.
- [x] Executar `npm run build` na pasta `frontend`: build aprovado com avisos preexistentes de budget do Dashboard e dependência CommonJS.
- [x] Executar `npx prettier --check "src/**/*.{ts,html,scss}"` na pasta `frontend`: o check global encontrou 50 arquivos preexistentes fora de padrão; os quatro arquivos alterados foram validados separadamente e passaram.
- [ ] Executar `git diff --check` e verificar manualmente `/transactions` em desktop e celular: `git diff --check` passou; a verificação visual segue pendente porque o controle automatizado do Chrome expirou aguardando aprovação.
- [x] Atualizar o status dos três documentos somente após a implementação e registrar os resultados reais dos comandos.

## Limites desta entrega

Sem alteração de backend, API, banco, dependências, URL, armazenamento local, paginação ou filtros adicionais. Se o volume de transações tornar o carregamento completo inadequado, uma feature posterior deverá planejar filtragem server-side com novo contrato.
