# api conventions

Serviços Angular usam HttpClient e Observable com modelos por feature. TransactionService consome GET/POST /api/transactions, PATCH /{id}/category e /{id}/account e DELETE /{id}. Os vínculos aceitam null. Tipos: INCOME, EXPENSE, INVESTMENT; origens: MANUAL, PLUGGY. Datas são strings e valores são number no cliente. Alterações devem acompanhar os DTOs do backend.

Mantenha URL, payload, mapping e detalhes de erro nos serviços da feature, sem espalhá-los por componentes. Reutilize o tipo da API como modelo de UI quando os significados coincidirem; converta na fronteira do serviço quando divergirem. Componentes consomem operações com nomes de negócio e não dependem de formatos específicos de fornecedor. Mudanças de contrato devem atualizar serviço, modelos, estados de UI e testes junto com o backend.
