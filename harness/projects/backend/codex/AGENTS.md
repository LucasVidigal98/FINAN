<!-- Gerado por harness/scripts/harness.mjs; edite as fontes em common/ e projects/<path>/. -->
# Regras gerais do workspace FINAN

Um único Git em FINAN/ contém os projetos frontend/ e backend/. Não inicialize Git nas aplicações. Branches, commits e status são compartilhados; confira o diff de ambos.
Leia também o AGENTS.md da raiz FINAN. Caminhos específicos partem da pasta da aplicação; infraestrutura e documentação compartilhadas ficam um nível acima.
Consulte e atualize os documentos temáticos afetados pelas mudanças e decisões adotadas. Preserve conteúdo manual válido, diferencie implementação de pendências e nunca registre secrets.
Leia o SKILL.md das skills pertinentes em .agents/skills/. Não executar bootstrap para reinicializar aplicações existentes.
Mudanças de API devem considerar backend, consumidores frontend e testes. Mantenha validação de negócio no backend.
Use Conventional Commits e registre validações e migrations nas propostas.
Após alterar fontes de orientação ou lista de documentos, execute da raiz FINAN: node harness/scripts/harness.mjs sync.

# Orientações específicas: backend

Workspace Java 21 / Spring Boot do FINAN, com frontend em ../frontend e Harness em ../harness; Git compartilhado na pasta pai.
Pacotes por domínio em src/main/java/br/com/finan e testes espelhados em src/test/java. Quatro espaços em Java, PascalCase nas classes, camelCase nos membros.
Valide entradas no backend e use BigDecimal para dinheiro. Preserve transações e tratamento de erros.
Migrations em src/main/resources/db/migration: nunca editar versões aplicadas, adicionar a próxima versão e preservar ddl-auto: validate.
Testes de integração exigem PostgreSQL separado e vazio; consulte ../harness/projects/backend/tests.md.
Edite esta fonte em ../harness/projects/backend/codex/project.md e execute node ../harness/scripts/harness.mjs sync backend; não edite o AGENTS.md gerado.

# Documentação viva do projeto

Antes de trabalhar, consulte os documentos do Harness pertinentes à tarefa. Conforme o usuário adota decisões e o projeto evolui, atualize os documentos afetados no mesmo trabalho.
Preserve conteúdo manual válido. Diferencie decisões aprovadas, implementação existente e pendências; ideias em discussão não são decisões. Não invente justificativas nem registre valores de secrets.
Os documentos temáticos descrevem o estado vigente; decisions.md registra decisões relevantes e seus motivos conhecidos em tópicos curtos, identificando decisões substituídas. Atualize também orientações compartilhadas quando a decisão realmente valer para outros projetos.
Documentos podem ser adicionados, renomeados ou removidos conforme a necessidade. Após mudar a lista ou as fontes de orientação da ferramenta, execute a sincronização indicada abaixo. Não é necessário executar bootstrap para manter a documentação.
Quando uma skill em .agents/skills/ corresponder à tarefa, leia seu SKILL.md e siga suas instruções.

Todos os caminhos abaixo são relativos à raiz do repositório da aplicação, não ao arquivo de regras nem ao destino do symlink. As fontes ficam em "../harness/projects/backend".

- "../harness/projects/backend/api_conventions.md"
- "../harness/projects/backend/api_docs.md"
- "../harness/projects/backend/architecture.md"
- "../harness/projects/backend/business_rules.md"
- "../harness/projects/backend/configuration.md"
- "../harness/projects/backend/decisions.md"
- "../harness/projects/backend/persistence.md"
- "../harness/projects/backend/security.md"
- "../harness/projects/backend/tests.md"

Sincronização a partir da raiz do repositório: node "../harness/scripts/harness.mjs" sync "backend"
