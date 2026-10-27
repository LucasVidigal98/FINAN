# Regras gerais do workspace FINAN

Um único Git em FINAN/ contém os projetos frontend/ e backend/. Não inicialize Git nas aplicações. Branches, commits e status são compartilhados; confira o diff de ambos.
Leia também o AGENTS.md da raiz FINAN. Caminhos específicos partem da pasta da aplicação; infraestrutura e documentação compartilhadas ficam um nível acima.
Consulte e atualize os documentos temáticos afetados pelas mudanças e decisões adotadas. Preserve conteúdo manual válido, diferencie implementação de pendências e nunca registre secrets.
Leia o SKILL.md das skills pertinentes em .agents/skills/. Não executar bootstrap para reinicializar aplicações existentes.
Mudanças de API devem considerar backend, consumidores frontend e testes. Mantenha validação de negócio no backend.
Use Conventional Commits e registre validações e migrations nas propostas.
Após alterar fontes de orientação ou lista de documentos, execute da raiz FINAN: node harness/scripts/harness.mjs sync.
