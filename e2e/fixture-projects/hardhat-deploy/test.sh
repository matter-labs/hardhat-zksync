#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"

run_test_and_handle_failure "pnpm hardhat compile" 0

DEPLOY_OUTPUT=$(pnpm hardhat deploy)

echo "$DEPLOY_OUTPUT"

if ! echo "$DEPLOY_OUTPUT" | grep -q "deploying \"Greeter\" (tx:"; then
  echo "Error: Greeter deployment text not found"
  exit 1
fi

if ! echo "$DEPLOY_OUTPUT" | grep -q "deploying \"Import\" (tx:"; then
  echo "Error: Import deployment text not found"
  exit 1
fi

if ! echo "$DEPLOY_OUTPUT" | grep -q "deploying \"TwoUserMultisig\" (tx:"; then
  echo "Error: TwoUserMultisig deployment text not found"
  exit 1
fi