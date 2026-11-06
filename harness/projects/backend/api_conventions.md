# api conventions

Rotas sob /api; DTOs e controllers junto ao domínio. TransactionController usa UUID, POST com @Valid e status 201, GET de lista, PATCH de categoria/conta e DELETE com 204. Services usam `ApplicationException` para falhas esperadas; `ApplicationExceptionHandler` traduz os tipos para 400, 404 e 409 sem envelope customizado. CORS dos controllers consultados permite http://localhost:4200. POST /api/open-finance/connect-token retorna connectToken com no-store e erro controlado 502.

Preserve os contratos existentes ao evoluir a arquitetura. Validação e tradução de request/response pertencem ao limite HTTP; regras novas de domínio ou aplicação não devem depender de status, headers ou tipos Spring MVC. Quando essa separação trouxer valor, mapeie erros estáveis para HTTP no controller ou em tratamento centralizado. Mudanças de payload, status ou formato de erro exigem atualização coordenada dos consumidores e testes.
