#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${HOME}/Library/Fonts"
mkdir -p "$DEST"
cp -v "$DIR"/VT323-Regular.ttf "$DEST/"
echo "VT323 instalada en $DEST — reinicia Word."
