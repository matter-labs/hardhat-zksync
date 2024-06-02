set -e

import_output=$(pnpm hardhat deploy-zksync:contract --contract-name Import --deployment-type create --no-compile 2>&1)

import_contract_address=$(echo "$import_output" | grep "Contract Import deployed at" | awk '{print $NF}')

# Check and echo the Import contract address
if [ -n "$import_contract_address" ]; then
    echo "Import contract was deployed at: $import_contract_address"
else
    echo "Failed to find the Import contract deployment address in the output."
fi