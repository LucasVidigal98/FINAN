# decisions

2026-10-14: por solicitação do usuário, frontend e backend são projetos separados no Harness, mantendo um único Git em FINAN. Codex identificado pelo AGENTS.md existente e pela sessão atual. Fontes centralizadas em harness/, expostas por symlinks. Estado existente: Angular 22 e SCSS, com DESIGN.md compartilhado. Não executar bootstrap sobre a aplicação existente.

2026-10-25: implementação da spec Pluggy Connect com SDK JavaScript oficial 2.14.2 na rota lazy `/open-finance`. Sandbox somente em desenvolvimento, conforme decisão da feature. Aguardar `destroy()` antes de liberar retry evita sobrepor tentativas no contexto compartilhado do SDK.

2026-10-26: homologação real do Pluggy Connect concluída no ambiente Docker e sandbox. Abertura, fechamento, retry com token novo, sucesso, falha controlada, recuperação, limpeza ao sair da página e ausência de token em logs/storage foram conferidos; importação permanece fora do escopo.
