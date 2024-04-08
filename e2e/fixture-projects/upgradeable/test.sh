#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"

echo "Adding missing dependencies..."
yarn add @matterlabs/hardhat-zksync-upgradable@0.4.0
yarn add @openzeppelin/contracts@4.9.5

run_test_and_handle_failure "yarn hardhat compile" 0

DEPLOY_OUTPUT=$(yarn hardhat run scripts/deploy-box-proxy.ts)

echo "$DEPLOY_OUTPUT"

if echo "$DEPLOY_OUTPUT" | grep -q "Box value is: 42"; then
    echo "Success: Box value is 42"
else
    echo "Error: Box value not found or incorrect."
    exit 1
fi

assert_directory_exists ".upgradable"
