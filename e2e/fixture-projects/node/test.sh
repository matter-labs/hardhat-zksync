#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running node"

pnpm hardhat node-zksync &

sleep 3

LOG_FILE="./era_test_node.log"

if grep -q "Node is ready at 127.0.0.1:8011" "$LOG_FILE"; then
    echo "ZKsync node started successfully."
else
    echo "Failed to start ZKsync node. Exiting with code 1."
    exit 1
fi
