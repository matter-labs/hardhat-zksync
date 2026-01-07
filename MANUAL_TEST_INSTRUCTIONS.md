# Manual Test Instructions for Factory Verification Issue

Since the test fixture is within the monorepo and has dependency issues, here are **two simple ways** to test if the factory verification issue is resolved:

## Option 1: Manual Verification Test (Quickest)

If you already have deployed contracts via a factory, you can test verification directly:

```bash
# Go to the verify package
cd packages/hardhat-zksync-verify

# Try to verify a factory-deployed contract
npx hardhat verify --network <network> \
  <CHILD_CONTRACT_ADDRESS> \
  --contract contracts/Child.sol:Child \
  --constructor-args <INITIAL_VALUE>
```

**Expected Results:**
- ✅ If it verifies successfully → Issue is FIXED
- ❌ If it fails with "Constructor arguments are not correct" → Issue still EXISTS

## Option 2: Quick Test with Existing Examples

Use an existing example project from the repo:

```bash
# Navigate to an example with deployer
cd examples/

# Check which examples have factory patterns
find . -name "*.sol" -exec grep -l "new.*(" {} \; 2>/dev/null
```

## Option 3: Create Standalone Test Project

Create a fresh test project outside the monorepo:

```bash
# Create new directory
mkdir -p ~/factory-verify-test
cd ~/factory-verify-test

# Initialize project
npm init -y
npm install --save-dev hardhat @matterlabs/hardhat-zksync-solc @matterlabs/hardhat-zksync-deploy @matterlabs/hardhat-zksync-verify @nomicfoundation/hardhat-verify zksync-ethers ethers

# Copy the test contracts
cp ~/msl/hardhat-zksync/packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment/contracts/* contracts/

# Create hardhat.config.js
cat > hardhat.config.js << 'EOF'
require("@matterlabs/hardhat-zksync-solc");
require("@matterlabs/hardhat-zksync-deploy");
require("@matterlabs/hardhat-zksync-verify");

module.exports = {
  zksolc: {
    version: "1.5.15",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev",
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification'
    },
  },
  solidity: {
    version: "0.8.16",
  },
};
EOF

# Create deploy script
cat > deploy-test.js << 'EOF'
const { Provider, Wallet } = require("zksync-ethers");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const hre = require("hardhat");

async function main() {
  console.log("Factory Verification Test\n");

  const provider = new Provider("https://sepolia.era.zksync.dev");
  const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY, provider);
  const deployer = new Deployer(hre, wallet);

  // Deploy Factory
  console.log("Deploying Factory...");
  const factoryArtifact = await deployer.loadArtifact("Factory");
  const factory = await deployer.deploy(factoryArtifact);
  console.log(`Factory: ${await factory.getAddress()}`);

  // Deploy Child via Factory
  console.log("Deploying Child via Factory...");
  const tx = await factory.deployChild(100);
  const receipt = await tx.wait();

  const event = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === 'ChildDeployed';
    } catch { return false; }
  });

  const childAddress = factory.interface.parseLog(event).args[0];
  console.log(`Child: ${childAddress}`);

  console.log("\nWaiting 10s for indexing...");
  await new Promise(r => setTimeout(r, 10000));

  // Verify Factory
  console.log("\nVerifying Factory...");
  try {
    await hre.run("verify:verify", {
      address: await factory.getAddress(),
      contract: "contracts/Factory.sol:Factory",
    });
    console.log("✓ Factory verified");
  } catch (e) {
    console.log("✗ Factory failed:", e.message);
  }

  // Verify Child (THE KEY TEST)
  console.log("\nVerifying Child...");
  try {
    await hre.run("verify:verify", {
      address: childAddress,
      contract: "contracts/Child.sol:Child",
      constructorArguments: [100],
    });
    console.log("✓ Child verified - ISSUE IS FIXED! 🎉");
  } catch (e) {
    console.log("✗ Child failed - ISSUE STILL EXISTS ❌");
    console.log("Error:", e.message);
  }
}

main().catch(console.error);
EOF

# Run it
WALLET_PRIVATE_KEY=your_key node deploy-test.js
```

## Option 4: Use Existing Verification Command

If you just want to test the verification part with already deployed contracts:

```bash
# From the monorepo root
cd packages/hardhat-zksync-verify

# Create a test args file
echo "module.exports = [100];" > /tmp/args.js

# Try to verify a known factory-deployed contract
npx hardhat verify \
  --network zkSyncTestnet \
  --contract contracts/Child.sol:Child \
  --constructor-args /tmp/args.js \
  0x_YOUR_CHILD_CONTRACT_ADDRESS
```

## What to Look For

### Issue is FIXED if you see:
```
Successfully verified contract Child on zkSync block explorer
```

### Issue STILL EXISTS if you see:
```
Error in plugin @matterlabs/hardhat-zksync-verify: Constructor arguments are not correct
```
or
```
The address provided contains a contract, but its bytecode doesn't match
```

## Related Issues

- [Issue #350](https://github.com/matter-labs/hardhat-zksync/issues/350)
- [Issue #362](https://github.com/matter-labs/hardhat-zksync/issues/362)
- [Issue #519](https://github.com/matter-labs/hardhat-zksync/issues/519)

## Test Contracts Location

The test contracts are ready to use at:
```
packages/hardhat-zksync-verify/test/fixture-projects/factoryDeployment/contracts/
- Factory.sol
- Child.sol
```

Both contracts compile successfully and are ready for deployment testing.
