#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running compatability-check"

run_test_and_handle_failure "pnpm hardhat compile" 0

pnpm hardhat deploy-zksync:libraries

pnpm hardhat compile

pnpm hardhat deploy-zksync

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"

pnpm hardhat run scripts/deploy-factory-uups.ts



