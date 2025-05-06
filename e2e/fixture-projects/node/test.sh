#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running node"

pnpm hardhat node-zksync --port 8012 &

sleep 10

if lsof -n -i | grep 8012; then
    echo "ZKsync node started successfully."
else
    echo "Failed to start ZKsync node. Exiting with code 1."
    exit 1
fi
