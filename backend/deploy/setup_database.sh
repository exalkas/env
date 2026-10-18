#!/usr/bin/env bash
# Explicit development reset: provide ADMIN_DATABASE_URL and application DB settings.
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
python "$script_dir/../reset_database.py" "$@"
