# FIXO — Tasks

Status: não iniciado. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md).

Nova convenção do projeto: checklist por entrega verificável, com critérios de aceite rastreáveis. Somente documentação foi produzida nesta etapa.

## 1. Cadastrar e listar FIXOs (CA01, CA09)

- [ ] Criar a próxima migration (V7 no estado atual), tabela `fixed_entries`, vínculo/competência em transações, CHECKs, FKs e UNIQUE mensal; preservar V1–V6 e `ddl-auto: validate`.
- [ ] Implementar POST/GET, DTOs, entidade e validações backend conforme o contrato; valor em BigDecimal, categoria obrigatória compatível e ativa, tipo receita/despesa, estado inicial ativo e elegibilidade no cadastro.
- [ ] Adicionar rota/navegação Fixos, serviço, formulário e lista no Angular, seguindo `DESIGN.md`; incluir carregamento, vazio, erro, acesso por teclado e orientação quando faltar categoria.
- [ ] Validar cadastro/lista por API e UI, rejeições CA01, persistência pós-recarga e preservação das transações existentes após migration.

## 2. Gerar uma ocorrência ao consultar o mês (CA02, CA03, CA06, CA07, CA08)

- [ ] Implementar cálculo do vencimento com dia original, último dia do mês, data inicial, elegibilidade e Clock em America/Sao_Paulo.
- [ ] Integrar geração à transação de escrita de `DashboardService.monthly`, antes da soma existente; preservar DTO e validar ano/mês antes de escrever. Aplicar no-store à resposta.
- [ ] Persistir transação normal com origem MANUAL, conta nula, categoria e vínculo FIXO/mês; não somar os modelos diretamente no dashboard.
- [ ] Testar antes/no/depois do dia, futuro, histórico elegível, anterior ao cadastro/início, fevereiro comum/bissexto, abril e volta ao dia 31 em março; usar relógio fixo e incluir fronteira de data local.
- [ ] Testar totais, contagem, saldo, listagem de transações, investimentos existentes e resumo sem FIXOs. Forçar categoria inválida e falha de persistência para comprovar rollback integral e erro visível.

## 3. Ativar/desativar sem duplicar (CA04, CA05, CA08, CA09)

- [ ] Implementar PATCH de estado desejado e botões acessíveis, sem mudança visual definitiva antes do sucesso. Repetir o mesmo PATCH não altera elegibilidade.
- [ ] Na reativação real, renovar `eligible_from` e validar categoria; preservar histórico e permitir desativação mesmo com categoria inválida.
- [ ] Usar bloqueios de linha em ordem estável na geração e no PATCH, verificar ocorrência após bloqueio e manter UNIQUE como garantia final.
- [ ] Testar recarga repetida e duas consultas simultâneas com transações independentes no PostgreSQL: ambas devem concluir, com uma ocorrência e totais corretos.
- [ ] Testar desativação antes/depois da geração, reativação antes/no/depois do vencimento, ausência de recuperação do período inativo, ocorrência já existente e disputa entre PATCH e dashboard.
- [ ] Testar falhas/retry no Angular, estado ativo preservado em erro e nova tentativa sem duplicação.

## 4. Validação integrada e entrega (CA01–CA09)

- [ ] Executar testes backend com banco PostgreSQL de testes separado e vazio, conforme AGENTS.md: `docker compose run --rm backend ./gradlew test`, com a conexão de teste corretamente configurada; não usar o banco pessoal.
- [ ] Executar `docker compose exec frontend npm test -- --watch=false` e `docker compose exec frontend npm run build`.
- [ ] Verificar formatação em frontend com `npx prettier --check "src/**/*.{ts,html,scss}"` no diretório frontend, usando o ambiente Node do projeto.
- [ ] Percorrer cadastro → dashboard antes/no dia → recarga → desativação → reativação, verificar listagem, layout responsivo e teclado; registrar screenshot da interface para a revisão.
- [ ] Atualizar documentação de uso com gatilho por data, efeito de escrita no GET, hipóteses de retroatividade, migration nova e comandos/resultados de validação.

## Limites desta entrega

Dia previsto como gatilho foi confirmado pelo usuário. As demais hipóteses estão na Spec e orientam as tasks; alterações nelas exigem manter os três documentos consistentes. Sem tasks para edição/exclusão, investimentos recorrentes, novas dependências, integração bancária ou agendador.
