# Pluggy Connect Widget no Angular — Spec Técnica

Status: frontend implementado conforme [Spec](spec.md); conferência real do sandbox pendente. Resultados em [Tasks](tasks.md).

## SDK verificado na implementação

Pacote oficial `pluggy-connect-sdk` 2.14.2. A exportação nomeada `PluggyConnect` e os tipos publicados confirmam `init(containerElement?: HTMLElement): Promise<void>` e `destroy(): Promise<void>`. O encerramento precisa terminar antes de liberar outra tentativa, pois o SDK destrói seu contexto Zoid compartilhado. As opções verificadas são `language: 'pt'`, `theme: 'dark'`, `includeSandbox` e `allowConnectInBackground: false`.

O próprio SDK registra falhas de renderização em `console.error` antes de rejeitar `init()`. O FINAN deve capturar a rejeição sem registrar o erro novamente; não altera globalmente o console do navegador. Essa limitação da dependência deve ser considerada na conferência de logs.

## Base anterior à implementação

- `backend/src/main/java/br/com/finan/pluggy/ConnectTokenController.java`: POST sem corpo, HTTP 200 com `{ "connectToken": "..." }` e `Cache-Control: no-store`; falhas retornam 502. Preservar esse contrato.
- `frontend/src/app/app.routes.ts`: páginas carregadas com `loadComponent`; ainda não há rota Open Finance.
- `frontend/src/app/app.html`: menu com cinco links. `app.spec.ts` verifica essa quantidade e precisará acompanhar o sexto link.
- `frontend/src/app/accounts/financial-account.service.ts`: padrão de serviço com `HttpClient`, injeção e URL local absoluta. `app.config.ts` já fornece HTTP e router.
- `AccountListComponent`: referência para signals, bloqueio de ação e mensagens controladas. `DESIGN.md` e `frontend/src/styles.scss` definem a apresentação escura existente.
- `frontend/package.json`: Angular 22, RxJS e Vitest; nenhum SDK Pluggy instalado.

## Arquivos e integração (CA01, CA04)

Implementados `frontend/src/app/open-finance/open-finance-page.component.ts`, `.html`, `.scss` e `.spec.ts`, além de `open-finance.service.ts` e `.spec.ts`. A rota lazy está em `app.routes.ts`, o link em `app.html` e o teste de menu/rota em `app.spec.ts`.

O serviço faz somente POST com corpo nulo para `http://localhost:8080/api/open-finance/connect-token`, seguindo o padrão local, com resposta tipada `{ connectToken: string }`. Não manter token em propriedade do serviço nem usar cache/replay. Validar string não vazia antes de abrir o SDK, pois tipagem TypeScript não valida a resposta HTTP.

SDK JavaScript oficial `pluggy-connect-sdk` 2.14.2 adicionado a `frontend/package.json` e ao lockfile. Exportação, tipos e API pública verificados no pacote instalado. Importá-lo na feature lazy; não criar abstração genérica de provedores ou carregador de scripts. O mock do módulo nos testes deve respeitar a API realmente instalada.

Página com título, breve explicação, botão nativo e mensagem de estado. Usar tokens, espaçamento e foco conforme `DESIGN.md`; `disabled` e guarda no handler impedem duplicidade. Mensagens neutras/sucesso com `role="status"`, erros com `role="alert"`; devolver foco ao botão após encerramento quando a página continuar ativa. Widget em português e tema escuro pelas opções documentadas. Usar `includeSandbox: isDevMode()` para atender à decisão de teste local sem habilitar sandbox na compilação de produção; manter conexão em background desabilitada.

## Ciclo de vida e segurança (CA02–CA03)

Manter estado simples da tentativa (ocioso, solicitando token, widget ativo) e mensagem separada. Guardar apenas a referência da instância e identidade da tentativa necessária para rejeitar eventos atrasados.

1. No clique válido, marcar solicitação antes de chamar HTTP e limpar feedback anterior.
2. Ao receber resposta válida da tentativa atual, passar o token diretamente à criação do widget e abri-lo. Não guardar uma cópia em signal, template, URL do FINAN ou singleton.
3. Capturar erro HTTP, resposta inválida e exceções de criação/abertura localmente, evitando que o listener global receba erros externos com dados sensíveis.
4. `onSuccess` e `onError` publicam apenas as mensagens fixas da Spec e finalizam a tentativa. Não registrar ou persistir o Item recebido. `onClose` sem resultado publica mensagem neutra.
5. Finalização deve ser idempotente: invalidar a tentativa antes de encerrar a instância pela API pública verificada, liberar a referência e reabilitar a ação. Ignorar callbacks disparados pelo próprio encerramento ou por instâncias anteriores; sucesso/erro seguido de close preserva o resultado.
6. Na destruição do componente, cancelar assinatura HTTP, invalidar callbacks e encerrar/liberar a instância. Usar os mecanismos Angular/RxJS existentes, sem infraestrutura global nova.

Não registrar token, exceção HTTP, configuração do widget ou payload de callbacks em console/telemetria. Não usar localStorage, sessionStorage, cookies ou IndexedDB. Liberar referências limita a retenção pelo aplicativo; a coleta de memória fica a cargo do navegador. Cada retry parte do POST novamente.

## Verificação (CA01–CA05)

| Critérios | Verificações planejadas |
| --- | --- |
| CA01 | HTTP mock verifica método, URL e corpo nulo; componente verifica loading, duplicidade, token encaminhado e uma instância; menu/rota levam à página. |
| CA02 | Mock SDK dispara sucesso, close, erro e falha de abertura; testar sucesso → close, erro → close e retry com novo POST/token. |
| CA03 | Resposta vazia/inválida não abre widget; destruição durante HTTP/widget e callbacks antigos não alteram nova tentativa; verificar liberação, ausência de logs e storage. Usar somente tokens fictícios nos testes. |
| CA04 | Conferir feedback acessível, foco e viewport móvel; verificar configuração sandbox no desenvolvimento e desabilitação em produção. |
| CA05 | Testes frontend, build, Prettier dos arquivos alterados, `git diff --check` e roteiro manual em Tasks. |

## Referências e limites

A [documentação oficial de configuração](https://v2.docs.pluggy.ai/en/docs/connect-widget/environments) identifica o SDK JavaScript, as opções de idioma/tema/sandbox e callbacks. O [guia de autenticação](https://docs.pluggy.ai/en/docs/connect-widget/authentication) demonstra criação do widget com token e abertura via `init()`. Consultados em 14/10/2026. Os tipos e o encerramento foram posteriormente conferidos no pacote instalado, conforme registro acima.

Callbacks servem ao feedback visual; alguns fluxos de autorização podem terminar fora da sessão. Não tratar callback ou fechamento como garantia de persistência ou cancelamento bancário. Não adicionar webhooks nesta entrega.


