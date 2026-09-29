# Autenticação Pluggy no backend — Spec

Status: implementada; testes automatizados aguardam ambiente Java ou Docker.

## Objetivo

Permitir que o backend solicite uma `apiKey` da Pluggy usando credenciais externas à aplicação, sem expor segredos ou tokens.

## Comportamento

- Ler `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` do ambiente. A ausência das credenciais não impede o fluxo manual de iniciar; tentar autenticar sem elas falha antes da chamada HTTP.
- Enviar `clientId` e `clientSecret` somente do backend para `POST https://api.pluggy.ai/auth` e devolver a `apiKey` apenas ao código servidor que chamou o cliente.
- Tratar falhas HTTP, respostas inválidas e credenciais ausentes com mensagens sem credenciais, tokens ou corpo da resposta remota.

## Critérios de aceite

- **CA01:** com credenciais externas válidas, a chamada envia o JSON esperado e retorna a `apiKey` recebida.
- **CA02:** falha de autenticação não expõe credenciais, `apiKey` nem resposta sensível em exceções ou logs.
- **CA03:** testes com HTTP simulado cobrem sucesso, falha e ausência de credenciais.

## Fora de escopo

Connect Token, endpoint público, cache/renovação da `apiKey` e integração com contas ou transações. A etapa seguinte implementará `POST /api/open-finance/connect-token` com uma renovação após `401`.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
