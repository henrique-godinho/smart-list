-- +goose Up
CREATE TABLE list (
    id UUID primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    frequency text,
    target_date DATE,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- +goose Down
DROP TABLE list;
