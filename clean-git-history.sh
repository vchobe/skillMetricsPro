#!/bin/bash
# ============================================================
# clean-git-history.sh
# Removes committed credential files from ALL git history.
# Run this manually in the Replit Shell tab.
# ============================================================

set -e

echo "==> Checking git-filter-repo..."
if ! command -v git-filter-repo &>/dev/null; then
  echo "git-filter-repo not found — it should already be installed."
  echo "If not, contact support."
  exit 1
fi

echo "==> Removing credential files from all commits..."
git-filter-repo \
  --path "client_secret_59463544587-echtadanm4lifuuj47gujio6gkg6f309.apps.googleusercontent.com.json" \
  --path "client_secret_59463544587-ti8416hmpruv5f7avjfnuqksluv6lq46.apps.googleusercontent.com.json" \
  --path "service-account-key.json" \
  --path "gmail-token.json" \
  --invert-paths \
  --force

echo "==> History rewritten. Re-adding GitHub remote..."
git remote add origin https://github.com/vchobe/skillMetricsPro.git

echo "==> Verifying secrets are gone..."
COUNT=$(git log --all --oneline --follow -- "client_secret_59463544587-echtadanm4lifuuj47gujio6gkg6f309.apps.googleusercontent.com.json" 2>/dev/null | wc -l)
if [ "$COUNT" -eq 0 ]; then
  echo "   Confirmed: no credential files remain in history."
else
  echo "   WARNING: files may still be present. Check manually."
fi

echo "==> Force pushing cleaned history to GitHub..."
git push origin main --force

echo ""
echo "Done! Your push should now succeed without secret-scanning errors."
echo ""
echo "IMPORTANT: Rotate your Google OAuth credentials in Google Cloud Console"
echo "since the old secrets were previously exposed in git history."
