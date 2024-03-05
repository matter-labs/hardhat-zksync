#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running zkSync inMemory node: $(basename "$(pwd)")"

# Kill any existing process occupying port 8011
PORT=8011
if lsof -ti:$PORT; then
    echo "Port $PORT is in use. Attempting to kill the occupying process..."
    lsof -ti:$PORT | xargs kill -9
    echo "Process occupying port $PORT has been terminated."
fi

yarn hardhat node-zksync &

NODE_PID=$!

cleanup() {
    echo "Cleaning up..."
    kill $NODE_PID
    wait $NODE_PID 2>/dev/null # redirect all error messages to nothing
}

trap cleanup EXIT

sleep 3

LOG_FILE="./era_test_node.log"

if grep -q "Node is ready at 127.0.0.1:8011" "$LOG_FILE"; then
    echo "zkSync node started successfully."
else
    echo "Failed to start zkSync node. Exiting with code 1."
    exit 1
fi
