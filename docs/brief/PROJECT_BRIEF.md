# KK Preloved Shirts — development starter

This package includes the previous premium website prototype (with 19 shirt images) and the implementation instructions for Claude.

## What currently works in the prototype
- Browse the hanging-shirt rail and shop grid
- Open product details, select a size, add to bag
- Filter/sort shirts and persist cart locally
- Enter customer details and copy order text
- WhatsApp order launch after a real business number is supplied

## Not yet production-ready
- Current branding reads FORME, not KK Preloved Shirts
- WhatsApp business number is blank
- Sizes are generic rather than verified item-level preloved sizes
- No persistent shared stock/admin backend or order reservation
- Size guide, delivery and returns need verified shop information
- A copied or opened order is not an accepted/successful order

## Before you run Claude
Extract this ZIP as a folder, open the folder in VS Code/Claude Code, and tell Claude to read `CLAUDE_PROMPT.md` and complete its requirements. Your website starter is in `website/`.

## Local preview of the current starter
From the `website/` folder run `python -m http.server 8080` then open http://localhost:8080 (or use VS Code Live Server). This is the static starter, not the completed full-stack shop.

## Git
If your repo is not already cloned, clone it separately, copy the generated project into it, review `git status`, and commit only when tests pass. Never include .env secrets.
