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
yarn add @matterlabs/hardhat-zksync-upgradable
yarn add @openzeppelin/contracts@4.9.5

cd -

echo "Pre-processing complete."
