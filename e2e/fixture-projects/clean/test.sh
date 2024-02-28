#! /usr/bin/env sh

# fail if any commands fails
set -e

# import helpers functions
. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"
run_test_and_handle_failure "yarn hardhat compile" 0