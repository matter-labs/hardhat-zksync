import { Wallet } from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

/**
 * Factory deployment verification test
 *
 * Tests the fix for issues:
 * - #350: Cannot verify a contract with construct args and created within another contract
 * - #362: Cannot verify a contract deployed within another contract
 * - #519: Issue with Verifying Contracts on zkSync When Deployed via External Library
 */
export default async function (hre: HardhatRuntimeEnvironment) {
    console.log('=====================================');
    console.log('Factory Deployment Verification Test');
    console.log('=====================================\n');

    // Get private key from environment
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('Please set WALLET_PRIVATE_KEY in your environment');
    }

    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);

    console.log(`Using account: ${wallet.address}\n`);

    // Step 1: Deploy the Factory contract
    console.log('Step 1: Deploying Factory contract...');
    const factoryArtifact = await deployer.loadArtifact('Factory');
    const factory = await deployer.deploy(factoryArtifact, []);
    const factoryAddress = await factory.getAddress();
    console.log(`✓ Factory deployed to: ${factoryAddress}\n`);

    // Step 2: Use the Factory to deploy a Child contract
    console.log('Step 2: Deploying Child contract via Factory...');
    const initialValue = 100;
    const tx = await factory.deployChild(initialValue);
    const receipt = await tx.wait();

    // Extract child address from event
    const childDeployedEvent = receipt.logs.find((log: any) => {
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

    // Wait for contracts to be indexed
    console.log('Waiting 15 seconds for contracts to be indexed...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

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

    // Step 4: Verify the Child contract (THE KEY TEST)
    console.log('Step 4: Verifying Child contract (factory-deployed)...');
    console.log('  This is the problematic scenario from issues #350, #362, #519\n');
    try {
        await hre.run('verify:verify', {
            address: childAddress,
            contract: 'contracts/Child.sol:Child',
            constructorArguments: [initialValue],
        });
        console.log('✓ Child verification succeeded');
        console.log('  🎉 THE ISSUE IS FIXED!\n');
    } catch (error: any) {
        console.log('✗ Child verification failed');
        console.log(`  Error: ${error.message}`);
        console.log('  ❌ THE ISSUE STILL EXISTS\n');
    }

    console.log('=====================================');
    console.log('Test Summary');
    console.log('=====================================');
    console.log(`Factory Address: ${factoryAddress}`);
    console.log(`Child Address: ${childAddress}`);
    console.log(`Child Constructor Args: [${initialValue}]`);
    console.log('\nRelated Issues:');
    console.log('- https://github.com/matter-labs/hardhat-zksync/issues/350');
    console.log('- https://github.com/matter-labs/hardhat-zksync/issues/362');
    console.log('- https://github.com/matter-labs/hardhat-zksync/issues/519');
    console.log('=====================================');
}
