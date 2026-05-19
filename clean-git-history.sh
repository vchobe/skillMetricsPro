#!/bin/bash
# ============================================================
# clean-git-history.sh
# Removes committed credential files from ALL git history.
# Run this manually in the Replit Shell tab:
#   bash clean-git-history.sh
# ============================================================

set -e

REMOTE_URL="https://github.com/vchobe/skillMetricsPro.git"

# All four files to purge from history
FILES_TO_PURGE=(
  "client_secret_59463544587-echtadanm4lifuuj47gujio6gkg6f309.apps.googleusercontent.com.json"
  "client_secret_59463544587-ti8416hmpruv5f7avjfnuqksluv6lq46.apps.googleusercontent.com.json"
  "service-account-key.json"
  "gmail-token.json"
)

BACKUP_DIR="/tmp/credential-backup-$$"

# ── Step 1: Back up any files that currently exist on disk ──────────────────
echo "==> Backing up existing credential files to $BACKUP_DIR ..."
mkdir -p "$BACKUP_DIR"
for f in "${FILES_TO_PURGE[@]}"; do
  if [ -f "$f" ]; then
    cp "$f" "$BACKUP_DIR/"
    echo "   Backed up: $f"
  fi
done

# ── Step 2: Verify git-filter-repo is available ─────────────────────────────
echo "==> Checking git-filter-repo..."
if ! command -v git-filter-repo &>/dev/null; then
  echo "ERROR: git-filter-repo not found. Install it first."
  exit 1
fi
echo "   Found: $(git-filter-repo --version)"

# ── Step 3: Build --path args and run the history rewrite ───────────────────
echo "==> Rewriting git history to remove credential files..."
PATH_ARGS=()
for f in "${FILES_TO_PURGE[@]}"; do
  PATH_ARGS+=("--path" "$f")
done

git-filter-repo "${PATH_ARGS[@]}" --invert-paths --force
echo "   History rewrite complete."

# ── Step 4: Restore credential files to disk (now untracked + gitignored) ───
echo "==> Restoring credential files to disk as untracked files..."
for f in "${FILES_TO_PURGE[@]}"; do
  BASENAME=$(basename "$f")
  if [ -f "$BACKUP_DIR/$BASENAME" ]; then
    cp "$BACKUP_DIR/$BASENAME" "./$f"
    echo "   Restored: $f"
  fi
done
rm -rf "$BACKUP_DIR"

# ── Step 5: Re-add or update the GitHub remote (filter-repo removes it) ─────
echo "==> Configuring GitHub remote..."
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$REMOTE_URL"
  echo "   Updated existing remote: $REMOTE_URL"
else
  git remote add origin "$REMOTE_URL"
  echo "   Added remote: $REMOTE_URL"
fi

# ── Step 6: Verify ALL four files are gone from history ─────────────────────
echo "==> Verifying all credential files are removed from history..."
FOUND_ANY=0
for f in "${FILES_TO_PURGE[@]}"; do
  COUNT=$(git log --all --oneline --follow -- "$f" 2>/dev/null | wc -l)
  if [ "$COUNT" -gt 0 ]; then
    echo "   WARNING: '$f' still appears in $COUNT commit(s)!"
    FOUND_ANY=1
  else
    echo "   Confirmed clean: $f"
  fi
done

if [ "$FOUND_ANY" -ne 0 ]; then
  echo ""
  echo "ERROR: Some files still found in history. Do NOT force-push. Investigate manually."
  exit 1
fi

# ── Step 7: Force push the cleaned history ───────────────────────────────────
echo "==> Force pushing cleaned history to GitHub..."
git push origin main --force
echo ""
echo "=========================================================="
echo "Done! Your push is complete and no secrets remain in history."
echo ""
echo "IMPORTANT SECURITY ACTION REQUIRED:"
echo "Rotate your Google OAuth credentials in Google Cloud Console"
echo "because the old secrets were previously exposed in git history."
echo "=========================================================="
