#!/usr/bin/env bash
# Runs a command with Node 22 loaded via nvm (used when working from Windows through WSL).
export NVM_DIR=/home/ayieko23/.nvm
. "$NVM_DIR/nvm.sh"
nvm use 22 >/dev/null
cd /home/ayieko23/kendy
"$@"
