# Autenticação Pluggy no backend — Spec Técnica

Status: implementação feita; validação automatizada pendente por indisponibilidade local de Java e Docker Engine.

## Base existente

- `backend/src/main/resources/application.yml` usa variáveis de ambiente para a configuração do backend.
- `docker-compose.yml` repassa variáveis ao serviço backend; `.env.example` documenta valores locais sem incluir segredos.
- O projeto usa Spring Boot 4.1.1 e já tem `RestClient` e Spring Test pelas dependências web existentes.

## Contrato e implementação

`PluggyProperties` vincula `pluggy.client-id` e `pluggy.client-secret` às variáveis `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`. `PluggyClient.authenticate()` usa `RestClient` para `POST https://api.pluggy.ai/auth`, corpo JSON `{ "clientId": "...", "clientSecret": "..." }`, e lê `{ "apiKey": "..." }` da resposta 200. [Contrato oficial](https://docs.pluggy.ai/en/reference/auth/auth-create).

O cliente não registra requisição, resposta nem credenciais. Em erro HTTP/transporte, descarta a exceção original para evitar que um corpo sensível apareça em logs de quem chamou. Ausência de configuração e resposta sem `apiKey` geram mensagens fixas sem dados remotos. As propriedades aceitam valores vazios para preservar a inicialização do modo manual.

## Verificação

`PluggyClientTests` usa `MockRestServiceServer`: verifica método, URL, JSON de credenciais e retorno da chave; simula 401 com corpo sensível e confere exceção sem causa; confirma que credenciais ausentes não enviam requisição. Executar `docker compose run --rm --no-deps backend ./gradlew test --tests br.com.finan.pluggy.PluggyClientTests` quando o Docker Engine estiver disponível.
