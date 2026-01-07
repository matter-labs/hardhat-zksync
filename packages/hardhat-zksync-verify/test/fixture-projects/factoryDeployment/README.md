# Factory Deployment Verification Test

This test fixture reproduces the long-standing issue with verifying contracts deployed by factory contracts.

## Related Issues

This test addresses multiple open issues in the repository:

- **Issue #350** (May 2024): "Cannot verify a contract with construct args and created within another contract"
  - Status: OPEN
  - Problem: Constructor arguments are not correct error

- **Issue #362** (Jan 2024): "Cannot verify a contract deployed within another contract with hardhat-zksync-upgradeable"
  - Status: OPEN
  - Problem: Cannot decode tx.input for proxy contracts

- **Issue #519** (Dec 2023): "Issue with Verifying Contracts on zkSync When Deployed via External Library"
  - Status: OPEN
  - Problem: Bytecode mismatch when deployed via library

## Problem Description

When a contract (Factory) deploys another contract (Child) with constructor arguments, the verification process fails with errors such as:
- "Constructor arguments are not correct"
- "The address provided as argument contains a contract, but its bytecode doesn't match any of your local contracts"

## Test Scenario

This fixture contains:

1. **Factory.sol**: A factory contract that deploys Child contracts
2. **Child.sol**: A simple contract with a uint256 constructor argument
3. **deploy.ts**: Deployment script that:
   - Deploys the Factory
   - Uses the Factory to deploy a Child with constructor arg (100)
   - Attempts to verify both contracts
   - Reports success/failure for each verification

## How to Run

```bash
# From the hardhat-zksync-verify package directory
cd packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment

# Make sure you have some testnet ETH for deployment
# Get testnet ETH from: https://portal.zksync.io/bridge

# Deploy and verify contracts
npx hardhat run deploy-simple.js --network zkSyncTestnet

# Or if you have a .env file with WALLET_PRIVATE_KEY:
WALLET_PRIVATE_KEY=your_private_key npx hardhat run deploy-simple.js --network zkSyncTestnet
```

## Expected Behavior

Both contracts should verify successfully:
- ✓ Factory contract verification should succeed
- ✓ Child contract verification should succeed

## Actual Behavior (as of Dec 2023)

Based on the open issues:
- ✓ Factory contract verification succeeds
- ✗ Child contract verification fails with "Constructor arguments are not correct"

## Success Criteria

The issue is considered FIXED when:
1. The Factory contract verifies successfully
2. The Child contract (deployed by Factory) verifies successfully
3. No errors about constructor arguments or bytecode mismatch occur

## Technical Details

- **Factory Contract**: Deploys Child contracts and emits a `ChildDeployed` event
- **Child Contract**: Simple contract with:
  - `uint256 public value` - set via constructor
  - `address public deployer` - tracks who deployed it
  - Constructor takes `uint256 _initialValue` as argument
- **Constructor Arguments**: `[100]` for the Child contract

## Testing Notes

This is a minimal reproduction case. The issue also affects:
- Upgradeable contracts (proxies)
- Contracts deployed via libraries
- Contracts with multiple constructor arguments
- Contracts deployed using CREATE2
