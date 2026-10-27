# Pluggy Connect Widget no Angular — Tasks

Status: implementação realizada; 89 testes locais aprovados e build de produção aprovado; conferência real do sandbox pendente em 25/10/2026. Entregas da [Spec](spec.md) e [Spec Técnica](spec-tecnica.md).

## 1. Abrir uma conexão pela área Open Finance (CA01, CA04)

- [x] Confirmar versão, exportação, tipos e métodos públicos de abertura/encerramento do `pluggy-connect-sdk`; registrar versão escolhida e adicionar dependência/lockfile.
- [x] Criar serviço HTTP sem cache para o endpoint existente; validar token não vazio antes do uso.
- [x] Criar página mínima, rota lazy `/open-finance` e item no menu; ajustar teste que espera cinco links.
- [x] Implementar botão “Conectar instituição”, loading, bloqueio de cliques e abertura de instância única com token novo.
- [x] Aplicar design existente, mensagens acessíveis, foco, idioma português, tema escuro e sandbox apenas em desenvolvimento, conforme resposta do usuário.

## 2. Encerrar e permitir nova tentativa (CA02–CA03)

- [x] Tratar sucesso, close e erro com mensagens fixas; preservar resultado terminal quando chegar close posterior.
- [x] Tratar erro HTTP, token inválido e exceção ao abrir; permitir novo POST a cada tentativa.
- [x] Encerrar/liberar instância de forma idempotente, cancelar requisição ao sair da página e ignorar respostas/callbacks antigos.
- [x] Verificar que token/configuração/payloads não vão para logs, storage, estado global ou interface; não persistir Item nem importar dados.

## 3. Verificar automaticamente (CA01–CA05)

- [x] Cobrir contrato HTTP, loading/duplicidade, abertura, sucesso, fechamento, erro, resposta inválida, falha de abertura e retry com token diferente.
- [x] Cobrir sucesso → close, erro → close, destruição durante HTTP/widget e callback de tentativa anterior.
- [x] Verificar link/rota, feedback acessível e configuração de sandbox por modo de execução.
- [ ] Executar os comandos de teste e build dentro dos containers quando o Docker voltar a iniciar. Equivalentes locais executados; consultar evidências abaixo.
- [x] Executar Prettier nos arquivos frontend alterados e `git diff --check`; registrar resultados reais e limitações.

## 4. Conferir no navegador (CA01–CA05)

- [ ] Com frontend/backend disponíveis e credenciais já configuradas, abrir Open Finance; conferir layout desktop/celular e navegação por teclado.
- [ ] Clicar em conectar e confirmar um POST e abertura do widget; repetir clique durante loading para verificar bloqueio, sem copiar token ou exportar HAR sensível.
- [ ] Fechar o widget, conferir feedback/foco e repetir; confirmar nova requisição e nova instância.
- [ ] Completar conexão sandbox e verificar mensagem de sucesso preservada após fechamento, sem importar dados para o FINAN.
- [ ] Simular falha do endpoint e erro do widget, usando sandbox quando possível; conferir mensagem sanitizada e retry após restaurar o funcionamento.
- [ ] Sair da página durante solicitação/widget; retornar e verificar ausência de modal órfão ou abertura tardia.
- [ ] Conferir ausência de segredos no console/storage e sandbox desabilitado na configuração de produção. Registrar evidências sem credenciais, tokens ou dados pessoais.
- [x] Atualizar status dos três documentos somente com resultados efetivamente observados. Não declarar a integração concluída antes da validação manual.

## Limites desta entrega

Frontend implementado com SDK 2.14.2. Backend, importação, persistência e migrations não foram alterados. Correções pré-existentes do dashboard foram necessárias para compilar e validar o frontend. A conferência manual completa depende da disponibilidade do Docker/backend e do sandbox.


## Evidências da retomada em 25/10/2026

- SDK instalado: 2.14.2; contrato público `init()`/`destroy()` conferido. O lockfile preserva os metadados prévios e adiciona apenas a árvore necessária ao SDK.
- Build local de produção aprovado. Sandbox resolvido como `false` no código gerado. Avisos não bloqueantes: stylesheet do dashboard de 7,74 kB acima do aviso de 4 kB (abaixo do erro de 8 kB) e dependência CommonJS `zoid` do SDK.
- Conferência local no navegador: rota/menu Open Finance, layout em 390×844 e 1280×800, acionamento por teclado, mensagem sanitizada com API indisponível, botão novamente habilitado e foco devolvido. Nova tentativa após erro também observada.
- Não foi observada uma conexão real nem sucesso/fechamento do widget no sandbox. Esses estados são cobertos pelo mock do SDK nos testes; não equivalem à homologação externa.
- Os containers haviam sido reconstruídos e reiniciados na sessão de 14/10. Na retomada, Docker Desktop falhou ao iniciar com `initializing Inference manager` / arquivo `dockerInference` inacessível (erro Windows 1920). Tentativa de preservar o socket com outro nome também falhou; nenhum volume ou banco foi removido. O comando de recriação foi interrompido enquanto aguardava o daemon.
- O servidor Angular local usado para inspeção foi encerrado após a conferência para liberar a porta 4200 para o Docker.
- Correções necessárias fora da feature: restauração de tags/blocos do dashboard rompidos por merge, remoção de CSS sobrescrito para respeitar o limite de build, e data fixa somente nos testes do dashboard que usavam fixtures de setembro de 2026.
- Limite de logs: o código do FINAN não registra tokens/payloads; o SDK oficial ainda contém log interno em falha de renderização. A ausência de segredos durante uma conexão real permanece pendente.

- Suíte local: 11 arquivos / 89 testes aprovados (`npm test -- --watch=false`). A execução inicial esbarrou em EPERM no diretório temporário do sandbox; o teste foi executado com TEMP/TMP dentro do workspace. Mock construtível ajustado para Vitest 4. Cobertura adicional: callback antigo após retry, resposta inválida, exceção no construtor e rejeição de destroy.


