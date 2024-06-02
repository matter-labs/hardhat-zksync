set -e

proxy_output=$(pnpm hardhat deploy-zksync:proxy --contract-name Box 42 --deployment-type create --initializer initialize --no-compile 2>&1)

# Extract deployment addresses
implementation_address=$(echo "$proxy_output" | grep "Implementation contract was deployed to" | awk '{print $NF}')
admin_address=$(echo "$proxy_output" | grep "Admin was deployed to" | awk '{print $NF}')
proxy_address=$(echo "$proxy_output" | grep "Transparent proxy was deployed to" | awk '{print $NF}')

# Check and echo the implementation address
if [ -n "$implementation_address" ]; then
    echo "Implementation contract was deployed at: $implementation_address"
else
    echo "Failed to find the Implementation contract deployment address in the output."
fi

# Check and echo the admin address
if [ -n "$admin_address" ]; then
    echo "Admin was deployed at: $admin_address"
else
    echo "Failed to find the Admin deployment address in the output."
fi

# Check and echo the proxy address
if [ -n "$proxy_address" ]; then
    echo "Transparent proxy was deployed at: $proxy_address"
else
    echo "Failed to find the Transparent proxy deployment address in the output."
fi

echo "---Upgrade Proxy---"

upgrade_output=$(yarn hardhat upgrade-zksync:proxy --contract-name BoxV2 --proxy-address "$proxy_address" --no-compile 2>&1)

new_contract_address=$(echo "$upgrade_output" | grep "Contract successfully upgraded to" | awk '{print $5}')
transaction_id=$(echo "$upgrade_output" | grep "with tx" | awk '{print $8}')

# Check and echo the new contract address
if [ -n "$new_contract_address" ]; then
    echo "Upgrade was successful. New contract address: $new_contract_address"
else
    echo "Failed to find the new contract address in the output."
fi