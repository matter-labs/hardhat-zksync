#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running mixed"

run_test_and_handle_failure "pnpm hardhat compile" 0

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"

assert_directory_exists "artifacts-zk/contracts/Auction.vy"
assert_directory_exists "artifacts-zk/contracts/Voting.v.py"
assert_directory_exists "artifacts-zk/contracts/Constant.sol"

assert_directory_not_empty "artifacts-zk"
assert_directory_not_empty "cache-zk"

DEPLOY_GREETER_OUTPUT=$(pnpm hardhat run scripts/deploy-greeter.ts --network dockerizedNode)

check_log_value "$DEPLOY_GREETER_OUTPUT" "Successful greeting from the contract"

DEPLOY_BOX_OUTPUT=$(pnpm hardhat run scripts/deploy-box-proxy.ts --network dockerizedNode)

check_log_value "$DEPLOY_BOX_OUTPUT" "Box value is:  42n"

UPGRADE_BOX_OUTPUT=$(pnpm hardhat run scripts/upgrade-box.ts --network dockerizedNode)

check_log_value "$UPGRADE_BOX_OUTPUT" "Successfully upgraded Box to BoxV2"

DEPLOY_VOTING_OUTPUT=$(pnpm hardhat deploy-zksync --network dockerizedNode)

check_log_value "$DEPLOY_VOTING_OUTPUT" "Voting sucessfull!"