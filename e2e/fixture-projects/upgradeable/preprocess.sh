#!/usr/bin/env bash

# Set script to exit on error
set -e

echo "Current directory before any operations: $(pwd)"

SOURCE_DIR="../packages/hardhat-zksync-upgradable"

TARGET_DIR="fixture-projects/upgradeable"

if [ ! -f "$SOURCE_DIR/package.json" ]; then
    echo "Error: Cannot find package.json at $SOURCE_DIR"
    exit 1
fi

echo "Copying package.json from $SOURCE_DIR to $TARGET_DIR"
cp "$SOURCE_DIR/package.json" "$TARGET_DIR/package.json"

cd "$TARGET_DIR"

echo "Adding missing dependencies in $TARGET_DIR"
pnpm install @matterlabs/hardhat-zksync-upgradable@1.3.1
pnpm install @openzeppelin/contracts@4.9.5

# Use sed to remove the "workspace:" prefix because pnpm is not properly installing zksync-upgradable plugin
sed -i 's/"workspace:1\.3\.1"/"1.3.1"/' package.json

cd -

echo "Pre-processing complete."
