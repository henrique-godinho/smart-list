-- +goose Up
CREATE TABLE list_items (
    id bigserial primary key,
    list_id UUID not null references list(id) on delete cascade,
    name text not null,
    qty smallint,
    unit text,
    price smallint,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- +goose Down
DROP TABLE list_items;
