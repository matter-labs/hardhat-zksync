#! /usr/bin/env sh

set -e

. ../../helpers.sh

echo "Running tests: $(basename "$(pwd)")"

yarn add typescript@5.1.6
yarn add ts-node@10.6.0
yarn add @matterlabs/hardhat-zksync@0.1.0

yarn hardhat deploy-zksync:contract --contract-name Greeter "Hi there!"

greeter_logs=$(echo "$greeter_output" | grep "Contract Greeter deployed at" | awk '{print $NF}')

# Check if we found the deployment address
if [ -n "$greeter_logs" ]; then
    echo "Greeter contract was deployed at: $greeter_logs"
else
    echo "Failed to find the Greeter deployment address in the output."
fi


empty_output=$(yarn hardhat deploy-zksync:contract --contract-name Empty --deployment-type create --no-compile 2>&1)

empty_logs=$(echo "$empty_output" | grep "Contract Empty deployed at" | awk '{print $NF}')


if [ -n "$empty_logs" ]; then
    echo "Empty contract was deployed at: $empty_logs"
else
    echo "Failed to find the Empty deployment address in the output."
    echo "$empty_output"
fi

chmod +x ./test-account-abstraction.sh
chmod +x ./test-factory.sh
chmod +x ./test-paymaster.sh
chmod +x ./test-upgradable-proxy.sh
chmod +x ./test-upgradable-proxy-uups.sh
chmod +x ./test-upgradable-beacon.sh


./test-account-abstraction.sh
echo "---------------"
./test-factory.sh
echo "---------------"
./test-paymaster.sh
echo "---------------"
./test-upgradable-proxy.sh
echo "---------------"
./test-upgradable-beacon.sh
echo "---------------"
./test-upgradable-proxy-uups.sh
echo "---------------"


