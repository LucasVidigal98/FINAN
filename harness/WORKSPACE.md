# Harness no FINAN

frontend/ e backend/ são projetos independentes no inventário do Harness, dentro do mesmo repositório Git. Abra a pasta da aplicação desejada como workspace, mantendo a pasta pai e harness/ acessíveis.

Cada aplicação deve receber AGENTS.md e oito links de skills em .agents/skills/. As fontes ficam em harness/common/codex/ e harness/projects/<projeto>/; não editar arquivos gerados.

Estado da configuração em 2026-10-14: inventário e orientações preparados para Codex. A criação dos links foi bloqueada pelo Windows com EPERM, inclusive na tentativa com permissão elevada. Habilitar Developer Mode ou usar um terminal com privilégio de symlink e executar os comandos link abaixo para concluir a ativação.

Para recriar a configuração após clonar, a partir da raiz FINAN:

```sh
node harness/scripts/harness.mjs init
node harness/scripts/harness.mjs link frontend codex
node harness/scripts/harness.mjs link backend codex
```

O inventário versionado já registra ambos os projetos; add permite registrá-los mesmo sem .git próprio. Não criar repositórios Git aninhados.
Após mudar fontes de orientação ou nomes de documentos: node harness/scripts/harness.mjs sync. Edições no conteúdo dos documentos temáticos são lidas diretamente.
No Windows, symlinks exigem Developer Mode ou privilégio equivalente. Ao clonar, preserve suporte a symlinks (core.symlinks); destinos ocupados são preservados pelo kit.
A montagem Docker inclui só a pasta da aplicação; links para ../harness são destinados ao agente no host e não resolvem dentro desses containers.
