CREATE TABLE financial_accounts (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL CHECK (name ~ '[^[:space:]]'),
    type VARCHAR(20) NOT NULL CHECK (type IN ('CHECKING', 'SAVINGS', 'CASH', 'INVESTMENT')),
    source VARCHAR(20) NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'PLUGGY')),
    initial_balance NUMERIC,
    provider_balance NUMERIC,
    external_id VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_financial_accounts_manual_initial_balance
        CHECK (source <> 'MANUAL' OR initial_balance IS NOT NULL)
);

CREATE UNIQUE INDEX uk_financial_accounts_active_manual_name
ON financial_accounts (LOWER(name)) WHERE source = 'MANUAL' AND active;

CREATE UNIQUE INDEX uk_financial_accounts_source_external_id
ON financial_accounts (source, external_id) WHERE external_id IS NOT NULL;
