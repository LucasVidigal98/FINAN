# security

Secrets de PostgreSQL e Pluggy pertencem ao backend/ambiente, nunca ao bundle Angular. Serviços consultados acessam a API local diretamente. Autenticação e autorização de usuários não foram avaliadas integralmente nesta configuração; não presumir proteção por CORS. Não registrar tokens nem dados financeiros sensíveis.

O Connect Token temporário passa somente pela tentativa em memória e pelo SDK oficial; o FINAN não o persiste, mostra ou registra. Erros exibidos são mensagens fixas. O SDK 2.14.2 registra internamente falhas de renderização no console, limitação documentada na spec técnica. Sandbox é habilitado por `isDevMode()` e desabilitado no build de produção; conexão em background permanece desabilitada.
