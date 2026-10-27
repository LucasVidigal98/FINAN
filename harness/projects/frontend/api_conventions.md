# api conventions

Serviços Angular usam HttpClient e Observable com modelos por feature. TransactionService consome GET/POST /api/transactions, PATCH /{id}/category e /{id}/account e DELETE /{id}. Os vínculos aceitam null. Tipos: INCOME, EXPENSE, INVESTMENT; origens: MANUAL, PLUGGY. Datas são strings e valores são number no cliente. Alterações devem acompanhar os DTOs do backend.
