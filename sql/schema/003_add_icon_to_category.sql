-- +goose Up
ALTER TABLE category ADD COLUMN icon text;

-- +goose Down
alter table category drop column icon;
