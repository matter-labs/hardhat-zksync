#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"

echo "Adding missing dependencies..."
pnpm add @matterlabs/hardhat-zksync-upgradable@1.9.0
pnpm add @openzeppelin/contracts@5.0.2

run_test_and_handle_failure "pnpm hardhat compile" 0

DEPLOY_OUTPUT=$(pnpm hardhat run scripts/deploy-box-proxy.ts)

echo "$DEPLOY_OUTPUT"

if echo "$DEPLOY_OUTPUT" | grep -q "Box value is:  42n"; then
    echo "Success: Box value is 42n."
else
    echo "Error: Box value not found or incorrect."
    exit 1
fi

assert_directory_exists ".upgradable"
