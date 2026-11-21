#!/usr/bin/env bash
# Deploy the built app to GitHub Pages via the gh-pages branch.
#
# Why not GitHub Actions? The gh OAuth token on this machine lacks the
# `workflow` scope, so pushes containing .github/workflows/* are rejected.
# This script builds with the /spookydesk/ base path and force-pushes dist/
# to the gh-pages branch, which Pages is configured to serve (legacy mode).
set -euo pipefail
cd "$(dirname "$0")/.."

VITE_BASE=/spookydesk/ npm run build

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
cp -r dist/. "$TMP/"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="spookydesk-deploy" -c user.email="deploy@spookydesk.local" \
  commit -qm "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f https://github.com/hupo3661/spookydesk.git gh-pages
echo "Pushed gh-pages. Site: https://hupo3661.github.io/spookydesk/"
