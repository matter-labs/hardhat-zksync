set -e

rm -r .upgradable

beacon_output=$(pnpm hardhat deploy-zksync:beacon --contract-name Box 42 --deployment-type create --initializer initialize --no-compile 2>&1)

echo "$beacon_output"

# Extract deployment addresses
beacon_impl_address=$(echo "$beacon_output" | grep "Beacon impl deployed at" | awk '{print $NF}')
beacon_address=$(echo "$beacon_output" | grep "Beacon deployed at" | awk '{print $NF}')
beacon_proxy_address=$(echo "$beacon_output" | grep "Beacon proxy deployed at" | awk '{print $NF}')

# Check and echo the beacon implementation address
if [ -n "$beacon_impl_address" ]; then
    echo "Beacon implementation was deployed at: $beacon_impl_address"
else
    echo "Failed to find the Beacon implementation deployment address in the output."
fi

# Check and echo the beacon address
if [ -n "$beacon_address" ]; then
    echo "Beacon was deployed at: $beacon_address"
else
    echo "Failed to find the Beacon deployment address in the output."
fi

# Check and echo the beacon proxy address
if [ -n "$beacon_proxy_address" ]; then
    echo "Beacon proxy was deployed at: $beacon_proxy_address"
else
    echo "Failed to find the Beacon proxy deployment address in the output."
fi

echo "---Upgrade Beacon---"

upgrade_output=$(yarn hardhat upgrade-zksync:beacon --contract-name BoxV2 --beacon-address "$beacon_address" --no-compile 2>&1)

echo "$upgrade_output"

new_contract_address=$(echo "$upgrade_output" | grep "New beacon impl deployed at" | awk '{print $6}')

# Check and echo the new contract address
if [ -n "$new_contract_address" ]; then
    echo "Upgrade was successful. New contract address: $new_contract_address"
else
    echo "Failed to find the new contract address in the output."
fi