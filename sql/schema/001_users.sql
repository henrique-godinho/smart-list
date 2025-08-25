-- +goose Up
CREATE TABLE users(
    id UUID primary key DEFAULT gen_random_uuid(),
    created_at timestamptz not null DEFAULT now(),
    updated_at timestamptz not null DEFAULT now(),
    email citext not null unique,
    hashed_password text not null,
    is_active boolean NOT NULL DEFAULT true,
    first_name text not null,
    last_name text not null
);

-- +goose Down
DROP TABLE users;