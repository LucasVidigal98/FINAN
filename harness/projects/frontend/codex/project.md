# Orientações específicas: frontend

Workspace Angular do FINAN, com backend em ../backend e Harness em ../harness; Git compartilhado na pasta pai.
Antes de alterar interfaces, leia ../DESIGN.md. Use dois espaços, aspas simples em TypeScript e vírgulas finais conforme o código.
Mantenha componentes, templates, SCSS, modelos e serviços junto à feature em src/app/. Reutilize shared/ e mantenha assets em public/.
Comandos e validações em ../harness/projects/frontend/tests.md. Comandos Docker Compose partem da raiz FINAN.
Edite esta fonte em ../harness/projects/frontend/codex/project.md e execute node ../harness/scripts/harness.mjs sync frontend; não edite o AGENTS.md gerado.
