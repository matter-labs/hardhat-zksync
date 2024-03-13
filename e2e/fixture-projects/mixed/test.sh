#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running mixed"

run_test_and_handle_failure "yarn hardhat compile" 0

assert_directory_exists "artifacts-zk"
assert_directory_exists "cache-zk"

assert_directory_exists "artifacts-zk/contracts/Auction.vy"
assert_directory_exists "artifacts-zk/contracts/Voting.v.py"
assert_directory_exists "artifacts-zk/contracts/Constant.sol"

assert_directory_not_empty "artifacts-zk"
assert_directory_not_empty "cache-zk"

kill_process_on_port 8011

yarn hardhat node-zksync &

# wait for node to start
sleep 1

DEPLOY_GREETER_OUTPUT=$(yarn hardhat run scripts/deploy-greeter.ts --network inMemoryNode)

check_log_value "$DEPLOY_GREETER_OUTPUT" "Successful greeting from the contract"

DEPLOY_BOX_OUTPUT=$(yarn hardhat run scripts/deploy-box-proxy.ts --network dockerizedNode)

check_log_value "$DEPLOY_BOX_OUTPUT" "Box value is:  42n"


UPGRADE_BOX_OUTPUT=$(yarn hardhat run scripts/upgrade-box.ts --network dockerizedNode)

check_log_value "$UPGRADE_BOX_OUTPUT" "Successfully upgraded Box to BoxV2"

DEPLOY_VOTING_OUTPUT=$(yarn hardhat deploy-zksync --network inMemoryNode)

check_log_value "$DEPLOY_VOTING_OUTPUT" "Voting sucessfull!"