-- name: GetCatalog :many
SELECT c.id,
       c.name,
       c.category_id,
       cat.name AS category_name,
       cat.icon AS category_icon
FROM catalog c
JOIN category cat ON cat.id = c.category_id
ORDER BY cat.id, c.name;

