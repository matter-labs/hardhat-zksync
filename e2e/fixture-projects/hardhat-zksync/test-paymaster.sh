set -e

token_output=$(yarn hardhat deploy-zksync:contract --contract-name Token "Ducat" "DCT" 18 --no-compile  2>&1)

token_address=$(echo "$token_output" | grep "Contract Token deployed at" | awk '{print $NF}')

# Check and echo the token contract address
if [ -n "$token_address" ]; then
    echo "Token contract was deployed at: $token_address"
else
    echo "Failed to find the Token contract deployment address in the output."
fi


paymaster_output=$(yarn hardhat deploy-zksync:contract --contract-name ApprovalPaymaster $token_address --no-compile --deployment-type createAccount 2>&1)

paymaster_address=$(echo "$paymaster_output" | grep "Contract ApprovalPaymaster deployed at" | awk '{print $NF}')

if [ -n "$paymaster_address" ]; then
    echo "ApprovalPaymaster contract was deployed at: $paymaster_address"
else
    echo "Failed to find the ApprovalPaymaster contract deployment address in the output."
fi