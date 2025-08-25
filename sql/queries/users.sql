-- name: CreateUser :one
INSERT INTO users (
    email, hashed_password, first_name, last_name
) VALUES (
    $1, $2, $3, $4
)
RETURNING *;

-- name: GetUserByEmail :one
SELECT id, email, first_name, last_name, is_active, created_at, updated_at, hashed_password
FROM users
WHERE email = $1;

