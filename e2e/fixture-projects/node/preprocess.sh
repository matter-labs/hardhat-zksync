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
yarn add @matterlabs/hardhat-zksync-node
yarn add ethers@6.0.0

cd -

echo "Pre-processing complete."
