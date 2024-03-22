#! /usr/bin/env sh

# fail if any commands fails
set -e

. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"
echo "it should fail the compilation"
run_test_and_handle_failure "pnpm hardhat compile" 1