#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running zkSync inMemory node"

# Kill any existing process on port 8011
PORT=8011
if lsof -ti:$PORT; then
    echo "Port $PORT is in use. Attempting to kill the occupying process..."
    lsof -ti:$PORT | xargs kill -9
    echo "Process occupying port $PORT has been terminated."
fi

yarn hardhat node-zksync &

sleep 3

LOG_FILE="./era_test_node.log"

if grep -q "Node is ready at 127.0.0.1:8011" "$LOG_FILE"; then
    echo "zkSync node started successfully."
else
    echo "Failed to start zkSync node. Exiting with code 1."
    exit 1
fi
