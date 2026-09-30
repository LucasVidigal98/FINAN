# Connect Token da Pluggy — Tasks

Status: implementação, testes e chamada real concluídos. Entregas da [Spec](spec.md) e [Spec Técnica](spec-tecnica.md).

## 1. Criar o endpoint (CA01–CA03)

- [x] Usar `PluggyClient.authenticate()` e criar token com `POST /connect_token`, cabeçalho `X-API-KEY` e corpo `{}`.
- [x] Expor apenas `connectToken` em `POST /api/open-finance/connect-token`, sem cache.
- [x] Renovar a chave e repetir uma vez após 401; sanitizar falhas em HTTP 502.

## 2. Verificar (CA01–CA03)

- [x] Adicionar testes HTTP simulados para sucesso, falha externa, renovação e segunda falha 401.
- [x] Executar testes com Java 21 no container backend: `BUILD SUCCESSFUL` em 29/09/2026.
- [x] Chamar o endpoint real: HTTP 200, somente `connectToken` preenchido, sem exibir o valor.
- [x] Executar `git diff --check`.

## Limites desta entrega

Sem widget, itens, contas, transações ou cache de chave.
