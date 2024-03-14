#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running compatability-check"

run_test_and_handle_failure "yarn hardhat compile" 0

kill_process_on_port 8011

yarn hardhat node-zksync &

while ! curl -s -X POST -d '{"jsonrpc":"2.0","method":"net_version","id":1}' -H 'Content-Type: application/json' 0.0.0.0:8011; do
    echo "Waiting for node-zksync to start..."
    sleep 1
done

yarn hardhat deploy-zksync:libraries --network inMemoryNode

yarn hardhat compile

yarn hardhat deploy-zksync --network inMemoryNode

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"






