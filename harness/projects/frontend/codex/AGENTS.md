<!-- Gerado por harness/scripts/harness.mjs; edite as fontes em common/ e projects/<path>/. -->
# Regras gerais do workspace FINAN

Um único Git em FINAN/ contém os projetos frontend/ e backend/. Não inicialize Git nas aplicações. Branches, commits e status são compartilhados; confira o diff de ambos.
Leia também o AGENTS.md da raiz FINAN. Caminhos específicos partem da pasta da aplicação; infraestrutura e documentação compartilhadas ficam um nível acima.
Consulte e atualize os documentos temáticos afetados pelas mudanças e decisões adotadas. Preserve conteúdo manual válido, diferencie implementação de pendências e nunca registre secrets.
Leia o SKILL.md das skills pertinentes em .agents/skills/. Não executar bootstrap para reinicializar aplicações existentes.
Mudanças de API devem considerar backend, consumidores frontend e testes. Mantenha validação de negócio no backend.
Use Conventional Commits e registre validações e migrations nas propostas.
Após alterar fontes de orientação ou lista de documentos, execute da raiz FINAN: node harness/scripts/harness.mjs sync.

# Orientações específicas: frontend

Workspace Angular do FINAN, com backend em ../backend e Harness em ../harness; Git compartilhado na pasta pai.
Antes de alterar interfaces, leia ../DESIGN.md. Use dois espaços, aspas simples em TypeScript e vírgulas finais conforme o código.
Mantenha componentes, templates, SCSS, modelos e serviços junto à feature em src/app/. Reutilize shared/ e mantenha assets em public/.
Comandos e validações em ../harness/projects/frontend/tests.md. Comandos Docker Compose partem da raiz FINAN.
Edite esta fonte em ../harness/projects/frontend/codex/project.md e execute node ../harness/scripts/harness.mjs sync frontend; não edite o AGENTS.md gerado.

# Documentação viva do projeto

Antes de trabalhar, consulte os documentos do Harness pertinentes à tarefa. Conforme o usuário adota decisões e o projeto evolui, atualize os documentos afetados no mesmo trabalho.
Preserve conteúdo manual válido. Diferencie decisões aprovadas, implementação existente e pendências; ideias em discussão não são decisões. Não invente justificativas nem registre valores de secrets.
Os documentos temáticos descrevem o estado vigente; decisions.md registra decisões relevantes e seus motivos conhecidos em tópicos curtos, identificando decisões substituídas. Atualize também orientações compartilhadas quando a decisão realmente valer para outros projetos.
Documentos podem ser adicionados, renomeados ou removidos conforme a necessidade. Após mudar a lista ou as fontes de orientação da ferramenta, execute a sincronização indicada abaixo. Não é necessário executar bootstrap para manter a documentação.
Quando uma skill em .agents/skills/ corresponder à tarefa, leia seu SKILL.md e siga suas instruções.

Todos os caminhos abaixo são relativos à raiz do repositório da aplicação, não ao arquivo de regras nem ao destino do symlink. As fontes ficam em "../harness/projects/frontend".

- "../harness/projects/frontend/api_conventions.md"
- "../harness/projects/frontend/api_docs.md"
- "../harness/projects/frontend/architecture.md"
- "../harness/projects/frontend/business_rules.md"
- "../harness/projects/frontend/configuration.md"
- "../harness/projects/frontend/decisions.md"
- "../harness/projects/frontend/persistence.md"
- "../harness/projects/frontend/security.md"
- "../harness/projects/frontend/tests.md"

Sincronização a partir da raiz do repositório: node "../harness/scripts/harness.mjs" sync "frontend"
