#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running compatability-check"

run_test_and_handle_failure "yarn hardhat compile" 0

kill_process_on_port 8011

yarn hardhat node-zksync &

# wait for node to start
sleep 3

yarn hardhat deploy-zksync:libraries --network inMemoryNode

yarn hardhat compile

yarn hardhat deploy-zksync --network inMemoryNode

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"






