/**
 * Simple deployment script for factory contract verification test
 *
 * This script reproduces the issue reported in:
 * - Issue #350: Cannot verify a contract with construct args and created within another contract
 * - Issue #362: Cannot verify a contract deployed within another contract
 * - Issue #519: Issue with Verifying Contracts on zkSync When Deployed via External Library
 *
 * Usage:
 *   npx hardhat run deploy-simple.js --network zkSyncTestnet
 */

const hre = require("hardhat");
const { Provider, Wallet } = require("zksync-ethers");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");

async function main() {
    console.log('=====================================');
    console.log('Factory Deployment Verification Test');
    console.log('=====================================\n');

    // Setup provider and wallet for zkSync
    const provider = new Provider(hre.network.config.url);

    // Get private key from environment or use Hardhat's first account
    const privateKey = process.env.WALLET_PRIVATE_KEY ||
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Default Hardhat key

    const wallet = new Wallet(privateKey, provider);
    const deployerHelper = new Deployer(hre, wallet);

    console.log(`Using account: ${wallet.address}\n`);

    // Step 1: Deploy the Factory contract
    console.log('Step 1: Deploying Factory contract...');
    const factoryArtifact = await deployerHelper.loadArtifact('Factory');
    const factory = await deployerHelper.deploy(factoryArtifact, []);
    const factoryAddress = await factory.getAddress();
    console.log(`✓ Factory deployed to: ${factoryAddress}\n`);

    // Step 2: Use the Factory to deploy a Child contract
    console.log('Step 2: Deploying Child contract via Factory...');
    const initialValue = 100;
    const tx = await factory.deployChild(initialValue);
    const receipt = await tx.wait();

    // Extract child address from event
    const childDeployedEvent = receipt.logs.find((log) => {
        try {
            const parsed = factory.interface.parseLog(log);
            return parsed && parsed.name === 'ChildDeployed';
        } catch {
            return false;
        }
    });

    if (!childDeployedEvent) {
        throw new Error('ChildDeployed event not found');
    }

    const parsedEvent = factory.interface.parseLog(childDeployedEvent);
    const childAddress = parsedEvent.args[0];
    console.log(`✓ Child deployed to: ${childAddress}`);
    console.log(`  Initial value: ${initialValue}\n`);

    // Wait a bit for the contracts to be indexed
    console.log('Waiting 10 seconds for contracts to be indexed...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 3: Verify the Factory contract
    console.log('Step 3: Verifying Factory contract...');
    try {
        await hre.run('verify:verify', {
            address: factoryAddress,
            contract: 'contracts/Factory.sol:Factory',
            constructorArguments: [],
        });
        console.log('✓ Factory verification succeeded\n');
    } catch (error) {
        console.log('✗ Factory verification failed');
        console.log(`  Error: ${error.message}\n`);
    }

    // Step 4: Verify the Child contract (this is where the issue occurs)
    console.log('Step 4: Verifying Child contract (factory-deployed)...');
    console.log('  This is the problematic scenario from issues #350, #362, #519');
    try {
        await hre.run('verify:verify', {
            address: childAddress,
            contract: 'contracts/Child.sol:Child',
            constructorArguments: [initialValue],
        });
        console.log('✓ Child verification succeeded');
        console.log('  🎉 The issue appears to be FIXED!\n');
    } catch (error) {
        console.log('✗ Child verification failed');
        console.log(`  Error: ${error.message}`);
        console.log('  ❌ The issue still EXISTS\n');
    }

    console.log('=====================================');
    console.log('Test Summary');
    console.log('=====================================');
    console.log(`Factory Address: ${factoryAddress}`);
    console.log(`Child Address: ${childAddress}`);
    console.log(`Child Constructor Args: [${initialValue}]`);
    console.log('=====================================');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
