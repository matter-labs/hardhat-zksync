# Factory Deployment Verification Example

This example tests the verification of contracts deployed by factory contracts on zkSync Era.

## Problem

Multiple open issues report that contracts deployed by factory contracts cannot be verified:
- [Issue #350](https://github.com/matter-labs/hardhat-zksync/issues/350) - "Cannot verify a contract with construct args and created within another contract"
- [Issue #362](https://github.com/matter-labs/hardhat-zksync/issues/362) - "Cannot verify a contract deployed within another contract with hardhat-zksync-upgradeable"
- [Issue #519](https://github.com/matter-labs/hardhat-zksync/issues/519) - "Issue with Verifying Contracts on zkSync When Deployed via External Library"

## Test Scenario

This example includes:
- **Factory.sol**: A factory contract that deploys Child contracts
- **Child.sol**: A simple contract with a constructor argument
- **deploy.ts**: Script that deploys both and attempts verification

## Setup

```bash
# Install dependencies
pnpm install

# Set your private key
export WALLET_PRIVATE_KEY="your_private_key_here"
```

## Run the Test

```bash
# Compile contracts
pnpm hardhat compile

# Deploy and verify (this will test if the issue is fixed)
pnpm hardhat deploy-zksync --script deploy.ts
```

## Expected Results

### If Issue is Fixed ✅
```
✓ Factory verification succeeded
✓ Child verification succeeded
  🎉 THE ISSUE IS FIXED!
```

### If Issue Still Exists ❌
```
✓ Factory verification succeeded
✗ Child verification failed
  Error: Constructor arguments are not correct
  ❌ THE ISSUE STILL EXISTS
```

## What This Tests

1. Deploys a Factory contract → Verifies it (should work)
2. Uses Factory to deploy a Child with constructor arg (100) → Verifies it (this is what fails)
3. Reports whether verification succeeds or fails

The key test is **Step 4** - verifying the Child contract that was deployed by the Factory with a constructor argument.
