#!/usr/bin/env bash


# fail if any commands fails
set -e

# import helpers functions
. ./helpers.sh

cd fixture-projects/clean
echo "Current directory: $(pwd)"
echo "Installing package dependencies..."
yarn
echo "[e2e] Starting test in $(basename "$(pwd)")"
chmod +x ./test.sh
./test.sh
assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"
echo "clean project tests succesfull."