#!/usr/bin/env bash
# Rootless helper for WSL/Ubuntu boxes without sudo: unpacks the few shared libraries
# Playwright's Chromium needs into ~/.local/pw-libs (outside the repo). Not needed in CI/Vercel.
set -euo pipefail
dest="$HOME/.local/pw-libs"
tmp="$(mktemp -d)"
mkdir -p "$dest"
cd "$tmp"
apt-get download libnspr4 libnss3 libasound2t64 2>/dev/null || apt-get download libnspr4 libnss3 libasound2
for deb in *.deb; do dpkg-deb -x "$deb" "$dest"; done
echo "Libraries unpacked. Use: LD_LIBRARY_PATH=$dest/usr/lib/x86_64-linux-gnu npx playwright test"
