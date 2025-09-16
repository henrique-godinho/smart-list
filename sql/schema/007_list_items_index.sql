-- +goose Up
CREATE UNIQUE INDEX IF NOT EXISTS list_items_list_id_name_uidx
  ON list_items (list_id, name);

-- +goose Down
DROP INDEX CONCURRENTLY IF EXISTS list_items_list_id_name_uidx;