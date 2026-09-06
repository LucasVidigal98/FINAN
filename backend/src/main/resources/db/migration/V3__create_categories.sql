CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL CHECK (name ~ '[^[:space:]]'),
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'INVESTMENT')),
    color VARCHAR(7) CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE UNIQUE INDEX uk_categories_name_type ON categories (LOWER(name), type);
