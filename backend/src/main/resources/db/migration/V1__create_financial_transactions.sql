CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY,
    description VARCHAR(150) NOT NULL CHECK (description ~ '[^[:space:]]'),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    occurred_on DATE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'INVESTMENT')),
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'PLUGGY')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
