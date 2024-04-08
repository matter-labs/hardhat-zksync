set -e

rm -r .upgradable

proxy_output=$(pnpm hardhat deploy-zksync:proxy --contract-name BoxUups 42 --deployment-type create --initializer initialize --no-compile 2>&1)

echo "$proxy_output"

implementation_address=$(echo "$proxy_output" | grep "Implementation contract was deployed to" | awk '{print $NF}')
uups_proxy_address=$(echo "$proxy_output" | grep "UUPS proxy was deployed to" | awk '{print $NF}')

# Check and echo the implementation contract address
if [ -n "$implementation_address" ]; then
    echo "Implementation contract was deployed at: $implementation_address"
else
    echo "Failed to find the Implementation contract deployment address in the output."
fi

# Check and echo the UUPS proxy address
if [ -n "$uups_proxy_address" ]; then
    echo "UUPS proxy was deployed at: $uups_proxy_address"
else
    echo "Failed to find the UUPS proxy deployment address in the output."
fi

echo "---Upgrade---"

upgrade_output=$(yarn hardhat upgrade-zksync:proxy --contract-name BoxUupsV2 --proxy-address "$uups_proxy_address" --no-compile 2>&1)

echo "$upgrade_output"

new_contract_address=$(echo "$upgrade_output" | grep "Contract successfully upgraded to" | awk '{print $5}')

# Check and echo the new contract address
if [ -n "$new_contract_address" ]; then
    echo "Upgrade was successful. New contract address: $new_contract_address"
else
    echo "Failed to find the new contract address in the upgrade output."
fi