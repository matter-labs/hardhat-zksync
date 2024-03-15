#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running compatability-check"

run_test_and_handle_failure "yarn hardhat compile" 0

yarn hardhat deploy-zksync:libraries --network dockerizedNode

yarn hardhat compile

yarn hardhat deploy-zksync --network dockerizedNode

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"

yarn hardhat run scripts/deploy-factory-uups.ts --network inMemoryNode



