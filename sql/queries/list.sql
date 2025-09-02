-- name: GetListsByUserId :many
SELECT li.*, l.name AS list_name, l.frequency, l.target_date, l.updated_at AS list_updated_at
FROM list_items li
JOIN list l ON li.list_id = l.id
WHERE l.user_id = $1
ORDER BY l.updated_at DESC;

