# api conventions

Rotas sob /api; DTOs e controllers junto ao domínio. TransactionController usa UUID, POST com @Valid e status 201, GET de lista, PATCH de categoria/conta e DELETE com 204. Services usam ResponseStatusException para 400, 404 e 409; não assumir envelope customizado. CORS dos controllers consultados permite http://localhost:4200. POST /api/open-finance/connect-token retorna connectToken com no-store e erro controlado 502.
