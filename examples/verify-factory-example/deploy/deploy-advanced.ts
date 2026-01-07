import { Wallet } from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ethers } from 'ethers';

/**
 * Comprehensive Factory Verification Test
 *
 * Tests ALL reported failing scenarios:
 * 1. Direct deployment with multiple constructor args (Issue #350)
 * 2. CREATE2 deployment (Issue #519)
 * 3. Library-based deployment (Issue #519)
 */
export default async function (hre: HardhatRuntimeEnvironment) {
    console.log('=========================================================');
    console.log('    COMPREHENSIVE FACTORY VERIFICATION TEST');
    console.log('=========================================================\n');

    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('Please set WALLET_PRIVATE_KEY in your environment');
    }

    const wallet = new Wallet(privateKey);
    const deployer = new Deployer(hre, wallet);

    console.log(`Deployer: ${wallet.address}\n`);

    // ========================================
    // STEP 1: Deploy Library
    // ========================================
    console.log('📦 STEP 1: Deploying DeploymentLibrary...');
    const libraryArtifact = await deployer.loadArtifact('DeploymentLibrary');
    const library = await deployer.deploy(libraryArtifact, []);
    const libraryAddress = await library.getAddress();
    console.log(`✓ Library deployed: ${libraryAddress}\n`);

    // ========================================
    // STEP 2: Deploy Factory (with library and factory deps)
    // ========================================
    console.log('📦 STEP 2: Deploying AdvancedFactory...');

    // Load ComplexChild artifact as it's deployed by the factory
    const complexChildArtifact = await deployer.loadArtifact('ComplexChild');

    const factoryArtifact = await deployer.loadArtifact('AdvancedFactory');
    const factory = await deployer.deploy(factoryArtifact, [], {
        factoryDeps: [complexChildArtifact.bytecode],
        libraries: {
            'contracts/DeploymentLibrary.sol:DeploymentLibrary': libraryAddress,
        },
    });
    const factoryAddress = await factory.getAddress();
    console.log(`✓ Factory deployed: ${factoryAddress}\n`);

    // ========================================
    // STEP 3: Test Direct Deployment (Issue #350)
    // ========================================
    console.log('📦 STEP 3: Testing Direct Deployment (Issue #350)');
    console.log('   Scenario: Factory deploys child with multiple constructor args\n');

    const childName1 = 'DirectChild_TestCase_2024';
    const childValue1 = 12345;
    const childOwner1 = wallet.address;

    const tx1 = await factory.deployChildDirect(childName1, childValue1, childOwner1);
    const receipt1 = await tx1.wait();

    const event1 = receipt1.logs.find((log: any) => {
        try {
            const parsed = factory.interface.parseLog(log);
            return parsed?.name === 'ChildDeployed';
        } catch {
            return false;
        }
    });

    const child1Address = factory.interface.parseLog(event1).args[0];
    console.log(`✓ Child (Direct) deployed: ${child1Address}`);
    console.log(`  Name: "${childName1}"`);
    console.log(`  Value: ${childValue1}`);
    console.log(`  Owner: ${childOwner1}\n`);

    // ========================================
    // STEP 4: Test CREATE2 Deployment (Issue #519)
    // ========================================
    console.log('📦 STEP 4: Testing CREATE2 Deployment (Issue #519)');
    console.log('   Scenario: Factory uses CREATE2 for deterministic addresses\n');

    const childName2 = 'CREATE2Child_TestCase_2024';
    const childValue2 = 67890;
    const childOwner2 = wallet.address;
    const salt = ethers.keccak256(ethers.toUtf8Bytes('test-salt-123'));

    const tx2 = await factory.deployChildCreate2(childName2, childValue2, childOwner2, salt);
    const receipt2 = await tx2.wait();

    const event2 = receipt2.logs.find((log: any) => {
        try {
            const parsed = factory.interface.parseLog(log);
            return parsed?.name === 'ChildDeployed';
        } catch {
            return false;
        }
    });

    const child2Address = factory.interface.parseLog(event2).args[0];
    console.log(`✓ Child (CREATE2) deployed: ${child2Address}`);
    console.log(`  Name: "${childName2}"`);
    console.log(`  Value: ${childValue2}`);
    console.log(`  Owner: ${childOwner2}`);
    console.log(`  Salt: ${salt}\n`);

    // ========================================
    // STEP 5: Test Library Deployment (Issue #519)
    // ========================================
    console.log('📦 STEP 5: Testing Library-based Deployment (Issue #519)');
    console.log('   Scenario: Factory uses external library to deploy child\n');

    const childName3 = 'LibraryChild_TestCase_2024';
    const childValue3 = 11111;
    const childOwner3 = wallet.address;

    const tx3 = await factory.deployChildViaLibrary(childName3, childValue3, childOwner3);
    const receipt3 = await tx3.wait();

    const event3 = receipt3.logs.find((log: any) => {
        try {
            const parsed = factory.interface.parseLog(log);
            return parsed?.name === 'ChildDeployed';
        } catch {
            return false;
        }
    });

    const child3Address = factory.interface.parseLog(event3).args[0];
    console.log(`✓ Child (Library) deployed: ${child3Address}`);
    console.log(`  Name: "${childName3}"`);
    console.log(`  Value: ${childValue3}`);
    console.log(`  Owner: ${childOwner3}\n`);

    // ========================================
    // STEP 6: Wait for Indexing
    // ========================================
    console.log('⏳ Waiting 20 seconds for blockchain indexing...\n');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // ========================================
    // STEP 7: Verify All Contracts
    // ========================================
    console.log('=========================================================');
    console.log('    VERIFICATION TESTS');
    console.log('=========================================================\n');

    const results = {
        library: false,
        factory: false,
        directChild: false,
        create2Child: false,
        libraryChild: false,
    };

    // Verify Library
    console.log('🔍 Verifying DeploymentLibrary...');
    try {
        await hre.run('verify:verify', {
            address: libraryAddress,
            contract: 'contracts/DeploymentLibrary.sol:DeploymentLibrary',
        });
        console.log('✅ Library verification: SUCCESS\n');
        results.library = true;
    } catch (error: any) {
        console.log('❌ Library verification: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }

    // Verify Factory
    console.log('🔍 Verifying AdvancedFactory...');
    try {
        await hre.run('verify:verify', {
            address: factoryAddress,
            contract: 'contracts/AdvancedFactory.sol:AdvancedFactory',
            libraries: {
                'contracts/DeploymentLibrary.sol:DeploymentLibrary': libraryAddress,
            },
        });
        console.log('✅ Factory verification: SUCCESS\n');
        results.factory = true;
    } catch (error: any) {
        console.log('❌ Factory verification: FAILED');
        console.log(`   Error: ${error.message}\n`);
    }

    // Verify Child 1 (Direct Deployment)
    console.log('🔍 Verifying Child #1 (Direct Deployment - Issue #350)...');
    try {
        await hre.run('verify:verify', {
            address: child1Address,
            contract: 'contracts/ComplexChild.sol:ComplexChild',
            constructorArguments: [childName1, childValue1, childOwner1],
        });
        console.log('✅ Child #1 verification: SUCCESS');
        console.log('   🎉 Issue #350 scenario is FIXED!\n');
        results.directChild = true;
    } catch (error: any) {
        console.log('❌ Child #1 verification: FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('   ⚠️  Issue #350 scenario still EXISTS\n');
    }

    // Verify Child 2 (CREATE2)
    console.log('🔍 Verifying Child #2 (CREATE2 Deployment - Issue #519)...');
    try {
        await hre.run('verify:verify', {
            address: child2Address,
            contract: 'contracts/ComplexChild.sol:ComplexChild',
            constructorArguments: [childName2, childValue2, childOwner2],
        });
        console.log('✅ Child #2 verification: SUCCESS');
        console.log('   🎉 Issue #519 CREATE2 scenario is FIXED!\n');
        results.create2Child = true;
    } catch (error: any) {
        console.log('❌ Child #2 verification: FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('   ⚠️  Issue #519 CREATE2 scenario still EXISTS\n');
    }

    // Verify Child 3 (Library)
    console.log('🔍 Verifying Child #3 (Library Deployment - Issue #519)...');
    try {
        await hre.run('verify:verify', {
            address: child3Address,
            contract: 'contracts/ComplexChild.sol:ComplexChild',
            constructorArguments: [childName3, childValue3, childOwner3],
        });
        console.log('✅ Child #3 verification: SUCCESS');
        console.log('   🎉 Issue #519 Library scenario is FIXED!\n');
        results.libraryChild = true;
    } catch (error: any) {
        console.log('❌ Child #3 verification: FAILED');
        console.log(`   Error: ${error.message}`);
        console.log('   ⚠️  Issue #519 Library scenario still EXISTS\n');
    }

    // ========================================
    // FINAL SUMMARY
    // ========================================
    console.log('=========================================================');
    console.log('    FINAL TEST RESULTS');
    console.log('=========================================================\n');

    console.log('Deployed Contracts:');
    console.log(`  Library:         ${libraryAddress}`);
    console.log(`  Factory:         ${factoryAddress}`);
    console.log(`  Child (Direct):  ${child1Address}`);
    console.log(`  Child (CREATE2): ${child2Address}`);
    console.log(`  Child (Library): ${child3Address}\n`);

    console.log('Verification Results:');
    console.log(`  Library:         ${results.library ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Factory:         ${results.factory ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Direct Deploy:   ${results.directChild ? '✅ PASS' : '❌ FAIL'} (Issue #350)`);
    console.log(`  CREATE2 Deploy:  ${results.create2Child ? '✅ PASS' : '❌ FAIL'} (Issue #519)`);
    console.log(`  Library Deploy:  ${results.libraryChild ? '✅ PASS' : '❌ FAIL'} (Issue #519)\n`);

    const allPassed = results.library && results.factory && results.directChild && results.create2Child && results.libraryChild;

    if (allPassed) {
        console.log('🎉🎉🎉 ALL TESTS PASSED! ALL ISSUES ARE FIXED! 🎉🎉🎉\n');
    } else {
        console.log('⚠️  SOME TESTS FAILED - Issues still exist\n');
    }

    console.log('Related Issues:');
    console.log('  - https://github.com/matter-labs/hardhat-zksync/issues/350');
    console.log('  - https://github.com/matter-labs/hardhat-zksync/issues/362');
    console.log('  - https://github.com/matter-labs/hardhat-zksync/issues/519');
    console.log('=========================================================');
}
