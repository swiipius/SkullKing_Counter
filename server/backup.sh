#!/bin/sh
# Daily copy of the leaderboard database, keeps the last 14. Cron example (Pi):
#   15 4 * * * /home/pierr/skullking/server/backup.sh >> /home/pierr/skullking/server/data/backup.log 2>&1
set -eu
cd "$(dirname "$0")"
mkdir -p data/backups
stamp=$(date +%Y-%m-%d)
docker compose exec -T leaderboard node -e "
  const { DatabaseSync } = require('node:sqlite');
  new DatabaseSync('/data/leaderboard.db').exec(\"VACUUM INTO '/data/backups/leaderboard-$stamp.db'\");
"
ls -1t data/backups/leaderboard-*.db | tail -n +15 | xargs -r rm -f
echo "$(date -Iseconds) backup ok: data/backups/leaderboard-$stamp.db"
