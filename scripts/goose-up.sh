#goose Up
#!/usr/bin/bash
set -euo pipefail
set -a; source .env; set +a
goose -dir ./sql/schema postgres "$DBSTRING" up