# Autenticação Pluggy no backend — Tasks

Status: código concluído; execução dos testes pendente. Entregas da [Spec](spec.md) e [Spec Técnica](spec-tecnica.md).

## 1. Configurar e autenticar (CA01, CA02)

- [x] Documentar `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` sem valores reais e repassá-los ao backend pelo Compose.
- [x] Criar `PluggyProperties` tipado e `PluggyClient` para `POST /auth`, com retorno de `apiKey` ao servidor.
- [x] Rejeitar credenciais ausentes e resposta sem chave; não incluir dados sensíveis nas exceções nem criar logs do fluxo.

## 2. Verificar o contrato (CA01–CA03)

- [x] Adicionar testes HTTP simulados para sucesso, 401 com resposta sensível e credenciais ausentes.
- [ ] Executar `docker compose run --rm --no-deps backend ./gradlew test --tests br.com.finan.pluggy.PluggyClientTests` e registrar o resultado. Tentativa em 28/09/2026: Docker Engine indisponível; Java e Gradle ausentes do PATH.
- [x] Executar `git diff --check`.
- [x] Executar `docker compose config --quiet` (exit 0).

## Limites desta entrega

Sem Connect Token, endpoint público, cache, migration ou dependência nova. Próxima etapa: `POST /api/open-finance/connect-token`, com uma renovação após `401` e testes.
