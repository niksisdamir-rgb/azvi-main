#!/bin/bash

# ==============================================================================
# Emergency Backup Script for BTRFS Corruption
# Target: /home/k/backups/
# ==============================================================================

# Configuration
BACKUP_DIR="/home/k/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOCKFILE="/tmp/emergency_backup.lock"

# Safety: Prevent concurrent runs
if [ -e "$LOCKFILE" ]; then
    echo "Backup already in progress!"
    exit 1
fi
touch "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "===================================================="
echo "🚀 Starting Emergency Backup: $TIMESTAMP"
echo "===================================================="

# List of critical paths
declare -a CRITICAL_PATHS=(
    "$HOME/.ssh"
    "$HOME/.gnupg"
    "$HOME/.config"
    "$HOME/.local/share/keyrings"
    "/home/k/Downloads/azvirt_dms"
)

for SOURCE in "${CRITICAL_PATHS[@]}"; do
    if [ -d "$SOURCE" ] || [ -f "$SOURCE" ]; then
        BASENAME=$(basename "$SOURCE")
        TARGET_FILE="$BACKUP_DIR/backup_${BASENAME}_${TIMESTAMP}.tar.gz"
        
        echo "📦 Archiving: $SOURCE -> $TARGET_FILE"
        
        # We use 'v' for verbosity to see which files might be failing due to I/O errors
        # 'p' to preserve permissions
        tar -czpf "$TARGET_FILE" -C "$(dirname "$SOURCE")" "$BASENAME" 2> "$BACKUP_DIR/error_${BASENAME}_${TIMESTAMP}.log"
        
        if [ $? -eq 0 ]; then
            echo "✅ Successfully backed up $BASENAME"
            rm -f "$BACKUP_DIR/error_${BASENAME}_${TIMESTAMP}.log"
        else
            echo "❌ WARNING: Some errors occurred while backing up $BASENAME. Check $BACKUP_DIR/error_${BASENAME}_${TIMESTAMP}.log"
        fi
    else
        echo "⚠️  Path not found: $SOURCE"
    fi
done

echo "===================================================="
echo "📊 Current Disk Stats"
btrfs device stats /
echo "===================================================="
echo "🏁 Backup Process Finished."
echo "Archives are located in: $BACKUP_DIR"
