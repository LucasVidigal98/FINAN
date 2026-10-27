# Maiores despesas no Dashboard — Tasks

Status: implementação concluída em 23/09/2026; frontend e testes backend unitário e de integração validados. Inspeção visual pendente. Entregas referentes à [Spec](spec.md) e à [Spec Técnica](spec-tecnica.md).

## 1. Devolver despesas ordenadas no backend (CA01–CA02)

- [x] Criar endpoint `/api/dashboard/largest-expenses` e DTOs com período, descrição, valor, data e categoria.
- [x] Reutilizar materialização/filtro comum de FIXOs, filtrar `EXPENSE`, ordenar no backend e limitar a cinco.
- [x] Adicionar testes focados de filtro, ordem, limite, categoria ausente, parâmetros inválidos e contrato HTTP.

## 2. Integrar ao Dashboard (CA03–CA04)

- [x] Adicionar modelo e método HTTP Angular.
- [x] Incluir lista no carregamento único, limpar dados antigos e validar resposta antes da publicação conjunta.
- [x] Testar renderização, vazio, troca de período, resposta obsoleta, erro e retry.

## 3. Apresentar e validar (CA05)

- [x] Criar seção semântica e responsiva seguindo `DESIGN.md`, com BRL/pt-BR e data.
- [x] Executar testes frontend (76/76), build, Prettier dos arquivos alterados e `git diff --check`; todos aprovados. Build mantém aviso de orçamento SCSS do Dashboard (5,60 kB ante limite de 4,00 kB).
- [x] Executar `DashboardServiceTests` no container backend; aprovado.
- [x] Executar testes de integração backend em PostgreSQL de testes separado e vazio; aprovado em banco temporário isolado.
- [ ] Inspecionar visualmente em desktop/celular; containers ativos para os testes de usabilidade do usuário.
- [x] Atualizar o status dos três documentos com os resultados reais.

## Limites desta entrega

Sem Pluggy, migration, dependência nova ou alteração dos cards e gráficos existentes. A validação integrada deles será iniciada somente após confirmação explícita da conclusão desta feature.

## Resultados da validação — 23/09/2026

| Comando | Resultado |
| --- | --- |
| `npm test -- --watch=false` em `frontend/` | Exit 0; 76 testes em 9 arquivos. A primeira tentativa falhou por restrição de leitura do sandbox; a repetição com acesso ao worktree passou. |
| `npm run build` em `frontend/` | Exit 0; aviso de orçamento SCSS de 1,60 kB acima do limite. |
| `npx prettier --check` nos sete arquivos frontend alterados | Exit 0. |
| `git diff --check` | Exit 0. |
| `docker compose exec -T backend ./gradlew test --tests br.com.finan.dashboard.DashboardServiceTests --no-daemon` | Exit 0; compilação dos testes e `DashboardServiceTests` aprovados. |
| Testes de integração backend e inspeção visual | Pendentes. Integração requer PostgreSQL de testes separado; containers locais estão ativos para os testes de usabilidade. |

## Validação final — 26/10/2026

| Comando | Resultado |
| --- | --- |
| `DashboardControllerTests` em PostgreSQL temporário e vazio | Exit 0; integração HTTP, persistência e `Cache-Control` aprovados. O banco temporário foi removido. |
| `DashboardServiceTests` no mesmo banco temporário | Exit 0. |
| `npm test -- --watch=false` em `frontend/` | Exit 0; 89 testes em 11 arquivos. |
| Teste focado de `dashboard.component.spec.ts` após endurecer a validação de contrato | Exit 0; 33 testes. |
| `npm run build` em `frontend/` | Exit 0; permanece o aviso de orçamento SCSS do Dashboard (7,74 kB ante limite de 4,00 kB). |
| Prettier nos dois arquivos frontend alterados e `git diff --check` | Exit 0. O check global do checkout continua apontando 56 arquivos preexistentes. |
| Inspeção visual desktop/celular | Pendente; a automação foi interrompida por não conseguir confirmar a URL atual do navegador com segurança. |
