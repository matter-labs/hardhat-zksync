#! /usr/bin/env sh

# fail if any commands fails
set -e

# import helpers functions
. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"
run_test_and_handle_failure "yarn hardhat compile" 0

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"

assert_directory_not_empty "artifacts-zk"
assert_directory_not_empty "cache-zk"