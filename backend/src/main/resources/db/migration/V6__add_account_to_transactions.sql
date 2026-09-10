ALTER TABLE financial_transactions
ADD COLUMN account_id UUID;

ALTER TABLE financial_transactions
ADD CONSTRAINT fk_transactions_account
FOREIGN KEY (account_id) REFERENCES financial_accounts(id);

CREATE INDEX idx_transactions_account_id
ON financial_transactions(account_id);
