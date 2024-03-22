#!/usr/bin/env bash

# Set script to exit on error
set -e

echo "Current directory before any operations: $(pwd)"

SOURCE_DIR="../packages/hardhat-zksync-node"
TARGET_DIR="fixture-projects/node"

if [ ! -f "$SOURCE_DIR/package.json" ]; then
    echo "Error: Cannot find package.json at $SOURCE_DIR"
    exit 1
fi

echo "Copying package.json from $SOURCE_DIR to $TARGET_DIR"
cp "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"

cd "$TARGET_DIR"

echo "Adding missing dependencies in $TARGET_DIR"
pnpm add @matterlabs/hardhat-zksync-node@1.0.3
pnpm add ethers@6.0.0

# Use sed to remove the "workspace:" prefix because pnpm is not properly installing zksync-node plugin
sed -i 's/"workspace:1\.0\.3"/"1.0.3"/' package.json

cd -

echo "Pre-processing complete."
