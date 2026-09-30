# Connect Token da Pluggy — Spec

Status: implementado; testes automatizados e chamada real concluídos em 29/09/2026.

## Objetivo

Disponibilizar ao cliente do FINAN um Connect Token da Pluggy sem revelar as credenciais nem a `apiKey` do backend.

## Comportamento

- `POST /api/open-finance/connect-token`, sem corpo, autentica o backend com a Pluggy e solicita um token para uma nova conexão.
- Sucesso retorna HTTP 200 e somente `{ "connectToken": "..." }`, com `Cache-Control: no-store`.
- Se a criação receber HTTP 401, o backend obtém outra `apiKey` e repete a criação uma vez. Uma segunda falha encerra a operação.
- Falhas de autenticação, transporte, HTTP ou resposta inválida retornam HTTP 502 com mensagem fixa, sem dados sensíveis.

## Critérios de aceite

- **CA01:** a chamada usa `apiKey` no cabeçalho da Pluggy e devolve apenas o Connect Token válido.
- **CA02:** após HTTP 401, uma nova `apiKey` é usada em uma única repetição.
- **CA03:** falhas não expõem credenciais, `apiKey`, token ou corpo remoto em respostas e logs; testes cobrem sucesso, falha e renovação.

## Fora de escopo

Widget, persistência de itens, cache de `apiKey` e demais etapas da integração Open Finance.

Detalhes: [Spec Técnica](spec-tecnica.md) e [Tasks](tasks.md).
