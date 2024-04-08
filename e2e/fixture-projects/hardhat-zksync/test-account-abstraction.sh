set -e

two_user_multisig_logs=$(yarn hardhat deploy-zksync:contract --contract-name TwoUserMultisig "0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA" "0x4F9133D1d3F50011A6859807C837bdCB31Aaab13" --deployment-type createAccount --no-compile 2>&1)

multisig_address=$(echo "$two_user_multisig_logs" | grep "Contract TwoUserMultisig deployed at" | awk '{print $NF}')

if [ -n "$multisig_address" ]; then
    echo "TwoUserMultisig contract was deployed at: $multisig_address"
else
    echo "Failed to find the TwoUserMultisig contract deployment address in the output."
fi