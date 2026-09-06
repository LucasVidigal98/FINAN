ALTER TABLE financial_transactions
ADD COLUMN category_id UUID;

ALTER TABLE financial_transactions
ADD CONSTRAINT fk_transactions_category
FOREIGN KEY (category_id) REFERENCES categories(id);

CREATE INDEX idx_transactions_category_id
ON financial_transactions(category_id);
