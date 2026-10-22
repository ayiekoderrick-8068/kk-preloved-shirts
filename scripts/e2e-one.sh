#!/usr/bin/env bash
# Runs a single Playwright test by title substring: scripts/e2e-one.sh "bag counter"
export NVM_DIR=/home/ayieko23/.nvm
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd "$(dirname "$0")/.."
[ -d "$HOME/.local/pw-libs" ] && export LD_LIBRARY_PATH="$HOME/.local/pw-libs/usr/lib/x86_64-linux-gnu"
npx playwright test -g "$1" --reporter=line 2>&1 | grep -v WebServer | tail -30 | cut -c1-220
