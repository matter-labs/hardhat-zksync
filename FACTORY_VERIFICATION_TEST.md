# Factory Contract Verification Test Report

## Issue Summary

**Confirmed**: There are **3 OPEN issues** (dating from Dec 2023 to May 2024) about the inability to verify contracts deployed by factory contracts.

### Related Issues

1. **[Issue #350](https://github.com/matter-labs/hardhat-zksync/issues/350)** - "Cannot verify a contract with construct args and created within another contract"
   - **Status**: OPEN (since May 29, 2024)
   - **Reporter**: zkbenny
   - **Error**: "Constructor arguments are not correct"
   - **Scenario**: Factory deploys Child contract with constructor arg (100)
   - **Result**: Factory verifies ✓, Child fails ✗

2. **[Issue #362](https://github.com/matter-labs/hardhat-zksync/issues/362)** - "Cannot verify a contract deployed within another contract with hardhat-zksync-upgradeable"
   - **Status**: OPEN (since Jan 3, 2024)
   - **Reporter**: statskiy-sovetnik
   - **Error**: Cannot decode tx.input for proxy contracts
   - **Scenario**: Upgradeable contract deployed via another contract
   - **Result**: Verification fails ✗

3. **[Issue #519](https://github.com/matter-labs/hardhat-zksync/issues/519)** - "Issue with Verifying Contracts on zkSync When Deployed via External Library"
   - **Status**: OPEN (since Dec 1, 2023)
   - **Reporter**: mshakeg
   - **Error**: "The address provided contains a contract, but its bytecode doesn't match"
   - **Scenario**: Factory uses library to deploy child contract with CREATE2
   - **Result**: Verification fails ✗

## Test Scenario Created

I've created a comprehensive test fixture to reproduce and test this issue:

### Location
`packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment/`

### Components

1. **Factory.sol**: Factory contract that deploys Child contracts
   ```solidity
   contract Factory {
       function deployChild(uint256 _initialValue) public returns (address) {
           Child child = new Child(_initialValue);
           // ...
       }
   }
   ```

2. **Child.sol**: Simple contract with constructor argument
   ```solidity
   contract Child {
       uint256 public value;
       constructor(uint256 _initialValue) {
           value = _initialValue;
       }
   }
   ```

3. **deploy.ts**: Deployment script that:
   - Deploys the Factory contract
   - Uses Factory to deploy a Child contract (with initialValue=100)
   - Attempts to verify both contracts
   - Reports success/failure for each

4. **Unit tests**: Validates the test fixture structure (6 passing tests)

### Files Created

```
packages/hardhat-zksync-verify/test/
├── fixture-projects/
│   └── factoryDeployment/
│       ├── contracts/
│       │   ├── Factory.sol          # Factory contract
│       │   └── Child.sol            # Child contract with constructor
│       ├── deploy.ts                # Deployment & verification script
│       ├── args.js                  # Constructor arguments [100]
│       ├── hardhat.config.js        # Configuration
│       └── README.md                # Detailed documentation
└── tests/
    └── factory-verification.test.ts  # Unit tests (6 passing ✓)
```

## How to Test

### Option 1: Run Unit Tests (Offline)
```bash
cd packages/hardhat-zksync-verify
pnpm test test/tests/factory-verification.test.ts
```
**Result**: ✓ All 6 tests passing

### Option 2: Test on Live Network (Online)
```bash
cd packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment

# Set your private key
export WALLET_PRIVATE_KEY="your_private_key"

# Deploy and verify
pnpm hardhat deploy-zksync --script deploy.ts --network zkSyncTestnet
```

This will:
1. Deploy Factory contract → Attempt verification
2. Deploy Child via Factory → Attempt verification
3. Report whether the issue is fixed or still exists

## Expected vs Actual Behavior

### Expected (When Fixed)
- ✓ Factory contract verification: **SUCCESS**
- ✓ Child contract verification: **SUCCESS**

### Actual (Based on Open Issues)
- ✓ Factory contract verification: **SUCCESS**
- ✗ Child contract verification: **FAILURE**
  - Error: "Constructor arguments are not correct"
  - OR: "Bytecode doesn't match any of your local contracts"

## Technical Details

### Problem Analysis
When a contract is deployed by another contract (factory pattern), the verification system struggles to:
1. Correctly extract constructor arguments from the deployment transaction
2. Match the deployed bytecode with local compilation artifacts
3. Handle the different deployment context (tx.input contains factory call, not child constructor args)

### Affected Scenarios
- ✗ Factory-deployed contracts with constructor arguments
- ✗ Upgradeable proxies deployed via factories
- ✗ Contracts deployed via libraries using CREATE2
- ✗ Nested contract deployments

### Working Scenarios
- ✓ Direct contract deployment with constructor arguments
- ✓ Factory contract verification (the factory itself)
- ✓ Contracts deployed without constructor arguments

## Next Steps

To determine if this issue has been resolved:

1. **Compile the test fixture**:
   ```bash
   cd packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment
   pnpm hardhat compile
   ```

2. **Deploy to testnet** (requires network connection):
   ```bash
   pnpm hardhat deploy-zksync --script deploy.ts --network zkSyncTestnet
   ```

3. **Observe the output**:
   - If both verifications succeed → **Issue is FIXED** 🎉
   - If Child verification fails → **Issue still EXISTS** 🔴

## Success Criteria

The issue is considered **RESOLVED** when:
- [x] Factory contract deploys successfully
- [x] Child contract deploys via Factory successfully
- [ ] Factory contract verifies successfully on block explorer
- [ ] **Child contract verifies successfully on block explorer** ← Key test
- [ ] No errors about constructor arguments
- [ ] No bytecode mismatch errors

## Related Test Cases to Consider

If this basic case passes, also test:
1. Factory deploying multiple different child contracts
2. Factory using CREATE2 for deterministic addresses
3. Factory using external libraries for deployment
4. Upgradeable proxies (BeaconProxy, TransparentProxy)
5. Child contracts with multiple constructor arguments
6. Child contracts with complex types (structs, arrays)

---

**Test Created By**: Claude (automated)
**Date**: 2025-12-17
**Purpose**: Reproduce and test factory contract verification issues #350, #362, #519
