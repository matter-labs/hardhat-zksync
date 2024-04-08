#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running node"

# Kill any existing process on port 8011
kill_process_on_port 8011

yarn add @matterlabs/hardhat-zksync-node@0.1.0
yarn add ethers@5.0.0

yarn hardhat node-zksync &

sleep 3

LOG_FILE="./era_test_node.log"

if grep -q "Node is ready at 127.0.0.1:8011" "$LOG_FILE"; then
    echo "zkSync node started successfully."
else
    echo "Failed to start zkSync node. Exiting with code 1."
    exit 1
fi
