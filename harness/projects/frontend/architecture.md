# architecture

## Estado atual

Angular 22, TypeScript, Router, HttpClient, RxJS e SCSS. Node.js é ferramenta de desenvolvimento, build e testes; a aplicação executa no navegador. Features em `src/app/`: `dashboard`, `transactions`, `accounts`, `categories` e `fixed-entries`; `shared/` guarda recursos realmente reutilizáveis e `public/` os estáticos. `app.routes.ts` carrega telas sob demanda e redireciona a raiz para dashboard. Backend e infraestrutura ficam na pasta pai. Antes de alterar interfaces, leia `../DESIGN.md`.

Open Finance está em `src/app/open-finance/`, com rota lazy `/open-finance`. `OpenFinanceService` valida o connect token e encapsula `pluggy-connect-sdk` 2.14.2; a página controla o estado da tentativa, descarta callbacks antigos e cancela a requisição ao sair. Ainda não importa nem persiste conexões, contas ou transações.

## Direção recomendada

- Preserve a organização por feature e as rotas lazy. Mantenha componente, template, estilos, modelos, serviço e testes próximos da funcionalidade; mova algo para `shared/` somente quando houver reutilização real entre features.
- Componentes cuidam de apresentação, interação, estado da tela e acessibilidade. Extraia comportamento significativo e reutilizável para serviços ou funções da feature; não crie wrappers que apenas repassam chamadas.
- Isole HTTP, SDKs e mapping de contratos em serviços da feature quando isso tornar a fronteira clara. Componentes não devem conhecer detalhes de URL, payload de fornecedor, armazenamento ou ciclo de vida de clientes externos.
- Faça o fluxo de dependência seguir `template -> componente -> serviço/função da feature -> integração`. Modelos de API e de UI podem ser o mesmo tipo quando têm o mesmo significado; se divergirem, converta na fronteira do serviço.
- Prefira nomes de negócio, funções pequenas e coesas, tipos explícitos nas fronteiras e uma fonte de verdade para cada estado. Use recursos nativos do Angular, signals, RxJS e Router antes de adicionar bibliotecas ou abstrações.
- Validação de formulário pertence à borda da UI, sem substituir a validação definitiva do backend. Preserve HTML semântico, teclado, foco e rótulos acessíveis.
- Não transplante para cada tela as camadas de backend: repository, use case, facade, tokens de DI ou state store só entram quando protegem uma fronteira real ou resolvem complexidade compartilhada comprovada.

Clean Architecture no frontend significa controlar dependências e isolar integrações, não reproduzir uma árvore fixa de camadas. Evolua uma feature por vez e mantenha a solução proporcional ao tamanho do FINAN.
