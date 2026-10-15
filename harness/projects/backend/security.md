# security

Secrets são fornecidos por ambiente; nunca versionar .env, senhas ou API keys. PluggyClient autentica no backend, oculta erros externos sensíveis e renova a API key uma vez após 401 na solicitação de connect token. Endpoint usa no-store. Não há dependência Spring Security no build.gradle inspecionado; política de autenticação/autorização para publicação permanece pendente. CORS não autentica usuários.
