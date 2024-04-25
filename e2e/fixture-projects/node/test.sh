#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running node"

# Kill any existing process on port 8011
kill_process_on_port 8011

pnpm add @matterlabs/hardhat-zksync-node@1.0.3
pnpm add ethers@6.0.0

pnpm hardhat node-zksync &

sleep 3

LOG_FILE="./era_test_node.log"

if grep -q "Node is ready at 0.0.0.0:8011" "$LOG_FILE"; then
    echo "zkSync node started successfully."
else
    echo "Failed to start zkSync node. Exiting with code 1."
    exit 1
fi
