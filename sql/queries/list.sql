-- name: GetListsByUserId :many
SELECT
  l.id          AS list_id,
  l.name       AS list_name,
  l.frequency,
  l.target_date,
  l.updated_at  AS list_updated_at,
  li.id         AS item_id,
  li.name       AS item_name,
  li.qty,
  li.unit,
  li.price,
  li.created_at AS item_created_at,
  li.updated_at AS item_updated_at
FROM list l
LEFT JOIN list_items li ON li.list_id = l.id
WHERE l.user_id = $1
ORDER BY l.updated_at DESC;


-- name: UpdateUserList :exec
INSERT INTO list_items (list_id, name, qty, updated_at)
SELECT @list_id::uuid, x.name, x.qty, NOW()
FROM jsonb_to_recordset(@items::jsonb) AS x(name text, qty smallint)
ON CONFLICT (list_id, name) DO UPDATE
SET qty = EXCLUDED.qty,
    name = EXCLUDED.name,
  updated_at = NOW();

-- name: RemoveItemsFromUserList :exec  
DELETE FROM list_items li
WHERE li.list_id = @list_id::uuid
AND NOT EXISTS (
SELECT 1
FROM jsonb_to_recordset(@items::jsonb) AS x(name text)
WHERE lower(trim(x.name)) = lower(trim(li.name))
);

-- name: GetUpdatedListById :many
SELECT li.id as item_id, li.list_id, li.name, li.qty, li.unit, li.price, li.updated_at, l.name as list_name, l.frequency, l.target_date, l.updated_at as list_updated_at
from list_items li
join list l on l.id = li.list_id
where list_id = $1
order by li.id;

-- name: CreateNewList :one
INSERT INtO list (user_id, name,  frequency, target_date)
VALUES (
  $1,
  $2,
  $3,
  $4
)
RETURNING id, name, frequency, target_date;
