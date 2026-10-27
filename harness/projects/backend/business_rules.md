# business rules

TransactionService cria transações MANUAL e lista por occurredOn decrescente. Exclusão exige origem MANUAL e ausência de lançamento fixo; caso contrário retorna conflito. Conta associada deve existir e estar ativa; null remove vínculo. FinancialAccountService impede nome duplicado de conta manual ativa ignorando caixa e lista contas ativas. CategoryService impede duplicidade de nome/tipo. FixedEntryService rejeita investimentos e usa Clock para datas. Este resumo não substitui os serviços/testes ao alterar regras financeiras ou recorrência.
