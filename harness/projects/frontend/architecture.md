# architecture

Angular 22, TypeScript, Router, HttpClient, RxJS e SCSS. Features em src/app/: dashboard, transactions, accounts, categories e fixed-entries; shared/ guarda recursos reutilizáveis e public/ os estáticos. app.routes.ts carrega telas sob demanda e redireciona a raiz para dashboard. Backend e infraestrutura ficam na pasta pai. Antes de alterar interfaces, leia ../DESIGN.md.

Open Finance está em `src/app/open-finance/`, com rota lazy `/open-finance`, serviço HTTP e página que usa `pluggy-connect-sdk` 2.14.2. A página controla uma tentativa por vez, descarta callbacks antigos e cancela a requisição ao sair. Ainda não importa nem persiste conexões, contas ou transações.
