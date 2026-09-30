# Connect Token da Pluggy — Spec Técnica

Status: código, testes automatizados e chamada real concluídos em 29/09/2026.

## Base existente

- `PluggyClient.authenticate()` obtém a `apiKey` com as propriedades já configuradas e descarta exceções HTTP sensíveis.
- `PluggyClientTests` usa `MockRestServiceServer`; o backend usa Spring `RestClient` e `MockMvc`.

## Contrato e implementação

`ConnectTokenController` expõe `POST /api/open-finance/connect-token`. `PluggyClient.createConnectToken()` autentica, envia `POST https://api.pluggy.ai/connect_token` com `X-API-KEY` e JSON `{}`, e lê `accessToken` da resposta da Pluggy. O controller o renomeia para `connectToken` no JSON público e marca a resposta como `no-store`. A Pluggy documenta [o cabeçalho e `accessToken`](https://v2.docs.pluggy.ai/en/reference/auth/connect-token-create).

Somente HTTP 401 na primeira criação provoca nova autenticação e uma segunda chamada. Falhas externas e respostas vazias viram exceção com texto fixo, sem causa remota; o controller devolve HTTP 502 com motivo fixo. Nenhum log é criado pelo fluxo.

## Verificação

`ConnectTokenControllerTests` simula autenticação e criação, e verifica JSON exato, `no-store`, erro sem dados remotos, renovação com chave diferente e limite de uma repetição. Em 29/09/2026, `docker compose exec -T backend ./gradlew test --tests br.com.finan.pluggy.ConnectTokenControllerTests --tests br.com.finan.pluggy.PluggyClientTests --console=plain` passou. Uma chamada real ao endpoint retornou HTTP 200 com apenas o campo `connectToken` preenchido; o valor não foi registrado.
