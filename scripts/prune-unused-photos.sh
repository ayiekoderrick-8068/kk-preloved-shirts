#!/usr/bin/env bash
# Removes processed photos in public/assets/products that no product in src/data/seed.ts references.
set -euo pipefail
cd "$(dirname "$0")/.."
used=$(grep -oE 'p-[0-9]{3}|\[[0-9, ]+\]' src/data/seed.ts | grep -E '^\[' | tr -d '[] ' | tr ',' '\n' | sort -n | uniq)
dups=$(echo "$used" | wc -l)
all=$(grep -E '^\s+\[' src/data/seed.ts | grep -oE '\[[0-9, ]+\]' | tr -d '[] ' | tr ',' '\n' | sort -n)
echo "photo numbers referenced: $(echo "$all" | wc -l), unique: $(echo "$all" | uniq | wc -l)"
removed=0
for f in public/assets/products/*.webp; do
  n=$(basename "$f" .webp | sed 's/p-0*//')
  if ! echo "$all" | grep -qx "$n"; then rm "$f"; removed=$((removed + 1)); fi
done
echo "removed $removed unused; kept $(ls public/assets/products | wc -l); size $(du -sh public/assets/products | cut -f1)"
: "$dups"
