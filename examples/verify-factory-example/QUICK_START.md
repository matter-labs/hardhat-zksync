# Quick Start - Factory Verification Test

## What This Tests

This example tests if **factory-deployed contracts can be verified** on zkSync Era - a long-standing issue with 3 open GitHub issues (#350, #362, #519).

## Files Created

```
examples/verify-factory-example/
├── contracts/
│   ├── Factory.sol       # Deploys Child contracts
│   └── Child.sol         # Simple contract with constructor
├── deploy/
│   └── deploy.ts         # Deployment & verification test
├── hardhat.config.ts     # Config using local packages
└── README.md             # Documentation
```

## How to Run

```bash
# 1. Navigate to the example
cd examples/verify-factory-example

# 2. Install dependencies (if needed)
pnpm install

# 3. Compile contracts
pnpm hardhat compile

# 4. Set your private key
export WALLET_PRIVATE_KEY="your_private_key_here"

# 5. Run the test
pnpm hardhat deploy-zksync --script deploy.ts
```

## What Will Happen

The script will:
1. ✅ Deploy Factory contract
2. ✅ Use Factory to deploy Child with constructor arg (100)
3. ✅ Verify Factory contract (should succeed)
4. ❓ **Verify Child contract** ← THIS IS THE KEY TEST

## Results

### If Verification Succeeds:
```
✓ Factory verification succeeded
✓ Child verification succeeded
  🎉 THE ISSUE IS FIXED!
```
→ **Issues #350, #362, #519 can be closed!**

### If Verification Fails:
```
✓ Factory verification succeeded
✗ Child verification failed
  Error: Constructor arguments are not correct
  ❌ THE ISSUE STILL EXISTS
```
→ **The issues are still present and need investigation**

## Why This Matters

When a factory contract deploys a child contract:
- The factory deploys successfully and verifies ✓
- The child deploys successfully ✓
- But verification of the child fails ✗

This affects:
- Factory patterns
- Upgradeable proxies
- CREATE2 deployments
- Contracts deployed via libraries

## Note on Node Version

If you see warnings about Node.js v25, consider using Node.js v18 or v20 (LTS versions) for better Hardhat compatibility:

```bash
nvm use 20  # or nvm use 18
```

## Related Issues

- https://github.com/matter-labs/hardhat-zksync/issues/350
- https://github.com/matter-labs/hardhat-zksync/issues/362
- https://github.com/matter-labs/hardhat-zksync/issues/519
