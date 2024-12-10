#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running node"

pnpm hardhat node-zksync --port 8012 &

sleep 10

LOG_FILE="./anvil_zksync.log"

if grep -q "Listening on 127.0.0.1:8012" "$LOG_FILE"; then
    echo "ZKsync node started successfully."
else
    echo "Failed to start ZKsync node. Exiting with code 1."
    exit 1
fi
