#!/usr/bin/env bash
# Runs lint, typecheck, unit tests and the Playwright suite. Uses rootless browser libs if present (WSL without sudo).
set -uo pipefail
export NVM_DIR=/home/ayieko23/.nvm
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd "$(dirname "$0")/.."
[ -d "$HOME/.local/pw-libs" ] && export LD_LIBRARY_PATH="$HOME/.local/pw-libs/usr/lib/x86_64-linux-gnu"
npm run lint 2>&1 | tail -3
npm run typecheck 2>&1 | tail -2
npm test 2>&1 | grep -E "Tests|Test Files"
npx playwright test --reporter=line 2>&1 | tail -3
