CREATE TABLE fixed_entries (
    id UUID PRIMARY KEY,
    description VARCHAR(150) NOT NULL CHECK (description ~ '[^[:space:]]'),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    category_id UUID NOT NULL,
    starts_on DATE NOT NULL,
    eligible_from DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT fk_fixed_entries_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX idx_fixed_entries_category_id ON fixed_entries(category_id);

ALTER TABLE financial_transactions
    ADD COLUMN fixed_entry_id UUID,
    ADD COLUMN fixed_month DATE;

ALTER TABLE financial_transactions
    ADD CONSTRAINT fk_transactions_fixed_entry
        FOREIGN KEY (fixed_entry_id) REFERENCES fixed_entries(id),
    ADD CONSTRAINT ck_transactions_fixed_month
        CHECK (
            (fixed_entry_id IS NULL AND fixed_month IS NULL)
            OR (
                fixed_entry_id IS NOT NULL
                AND fixed_month IS NOT NULL
                AND fixed_month = date_trunc('month', fixed_month)::date
            )
        );

CREATE UNIQUE INDEX uk_transactions_fixed_entry_month
    ON financial_transactions(fixed_entry_id, fixed_month);
