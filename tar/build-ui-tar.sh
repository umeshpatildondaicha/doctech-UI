#!/bin/bash
# Build a clean tar/ui.tar from git (no macOS ._* or xattr) for Render deploy.
# Run from repo root: ./tar/build-ui-tar.sh

set -e
cd "$(git rev-parse --show-toplevel)"
TMP=/tmp/doctech-archive-$$
mkdir -p "$TMP" && trap "rm -rf $TMP" EXIT

git archive -o "$TMP/src.tar" HEAD
tar -xf "$TMP/src.tar" -C "$TMP"
find "$TMP" -name '*.tar' -type f -delete
COPYFILE_DISABLE=1 tar -cvf tar/ui.tar -C "$TMP" .
echo "Created tar/ui.tar ($(ls -lh tar/ui.tar | awk '{print $5}'))"
