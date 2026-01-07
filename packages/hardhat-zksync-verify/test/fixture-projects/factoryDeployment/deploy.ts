import { Wallet } from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * Test script for factory-deployed contract verification
 *
 * This script reproduces the issue reported in:
 * - Issue #350: Cannot verify a contract with construct args and created within another contract
 * - Issue #362: Cannot verify a contract deployed within another contract
 * - Issue #519: Issue with Verifying Contracts on zkSync When Deployed via External Library
 *
 * Steps:
 * 1. Deploy the Factory contract
 * 2. Use the Factory to deploy a Child contract with constructor arguments
 * 3. Attempt to verify both contracts
 * 4. Document whether verification succeeds or fails
 */
export default async function (hre: HardhatRuntimeEnvironment) {
    console.log('=====================================');
    console.log('Factory Deployment Verification Test');
    console.log('=====================================\n');

    const wallet = new Wallet(process.env.WALLET_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    const deployer = new Deployer(hre, wallet);

    // Step 1: Deploy the Factory contract
    console.log('Step 1: Deploying Factory contract...');
    const factoryArtifact = await deployer.loadArtifact('Factory');
    const factory = await deployer.deploy(factoryArtifact, []);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log(`✓ Factory deployed to: ${factoryAddress}\n`);

    // Step 2: Use the Factory to deploy a Child contract
    console.log('Step 2: Deploying Child contract via Factory...');
    const initialValue = 100;
    const tx = await factory.deployChild(initialValue);
    const receipt = await tx.wait();

    // Extract child address from event
    const childDeployedEvent = receipt.logs.find(
        (log: any) => log.fragment && log.fragment.name === 'ChildDeployed'
    );

    if (!childDeployedEvent) {
        throw new Error('ChildDeployed event not found');
    }

    const childAddress = childDeployedEvent.args[0];
    console.log(`✓ Child deployed to: ${childAddress}`);
    console.log(`  Initial value: ${initialValue}\n`);

    // Step 3: Verify the Factory contract
    console.log('Step 3: Verifying Factory contract...');
    try {
        await hre.run('verify:verify', {
            address: factoryAddress,
            contract: 'contracts/Factory.sol:Factory',
            constructorArguments: [],
        });
        console.log('✓ Factory verification succeeded\n');
    } catch (error: any) {
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
        console.log('  The issue appears to be FIXED!\n');
    } catch (error: any) {
        console.log('✗ Child verification failed');
        console.log(`  Error: ${error.message}`);
        console.log('  The issue still EXISTS\n');
    }

    console.log('=====================================');
    console.log('Test Summary');
    console.log('=====================================');
    console.log(`Factory Address: ${factoryAddress}`);
    console.log(`Child Address: ${childAddress}`);
    console.log(`Child Constructor Args: [${initialValue}]`);
    console.log('=====================================');
}
