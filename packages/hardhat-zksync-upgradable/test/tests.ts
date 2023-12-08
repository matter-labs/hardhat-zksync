import assert from 'assert';
import { useEnvironment } from './helpers';
import { ContractFactory, Provider,Contract } from 'zksync-ethers';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import path from 'path';

import { TEST_ADDRESS, authorizationErrors, standaloneValidationErrors, storageLayoutErrors } from './constants';
import { LOCAL_SETUP_ZKSYNC_NETWORK, MANIFEST_DEFAULT_DIR } from '../src/constants';
import { getAdminFactory } from '../src/proxy-deployment/deploy-proxy-admin';
import { deploy } from '../src/proxy-deployment/deploy';
import { getManifestAdmin } from '../src/admin';
import richWallets from './rich-wallets.json';

import { getAdminAddress } from '@openzeppelin/upgrades-core';
import { describe } from 'node:test';

import '../src/type-extensions'



describe('Upgradable plugin tests', async function () {
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e');

        let boxProxy: Contract;

        before('Deploy Box proxy and contract implementation', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow('Deploying ' + contractName + ' transparent proxy...'));

            const boxArtifact = await this.deployer.loadArtifact(contractName);
            boxProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'initialize',
            });
            await boxProxy.waitForDeployment();
        });

        it('Should deploy proxy and contract implementation', async function () {
            await boxProxy.waitForDeployment();
            boxProxy.connect(this.deployer.zkWallet);
            const value = await boxProxy.retrieve();
            assert.equal(value, 42n);
        });
     
        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxV2';

            console.info(chalk.yellow('Upgrading Box to ' + contractName + '...'));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await boxProxy.getAddress(), BoxV2);
            await box2.waitForDeployment();
            //give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });
     
        it('Should fail to deploy proxy for implementation that is not upgrade safe', async function () {
            const contractName = 'BoxUpgradeUnsafe';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                    initializer: 'initialize',
                }),
                (error: any) => {
                    return (
                        error.message.includes(standaloneValidationErrors.USE_OF_DELEGATE_CALL) &&
                        error.message.includes(standaloneValidationErrors.STATE_VARIABLE_ASSIGNMENT) &&
                        error.message.includes(standaloneValidationErrors.STATE_VARIABLE_IMMUTABLE)
                    );
                }
            );
        });
    });
    describe.skip('Test UUPS proxy deployment and upgrade functionalities', async function () {
        useEnvironment('uups-e2e');
        let boxUupsProxy: Contract;
        let boxUupsPublicProxy: Contract;

        before('Deploy BoxUups and BoxUupsPublic proxy and contract implementation', async function () {
            const contractName1 = 'BoxUups';
            const contractName2 = 'BoxUupsPublic';

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            boxUupsProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'initialize',
            });
            await boxUupsProxy.waitForDeployment()

            console.info(chalk.yellow('Deploying ' + contractName2 + ' uups proxy...'));

            const boxPublicArtifact = await this.deployer.loadArtifact(contractName2);
            boxUupsPublicProxy = await this.env.zkUpgrades.deployProxy(
                this.deployer.zkWallet,
                boxPublicArtifact,
                [42],
                {
                    initializer: 'initialize',
                }
            );
            await boxUupsPublicProxy.waitForDeployment();
        });

        it('Should deploy uups proxy and contract implementation', async function () {
            await boxUupsProxy.waitForDeployment();
            //await new Promise((resolve) => setTimeout(resolve, 1500));
            boxUupsProxy.connect(this.deployer.zkWallet);
            const value = await boxUupsProxy.retrieve();

            assert.equal(value, 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow('Upgrading BoxUups to ' + contractName + '...'));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await boxUupsProxy.getAddress(), BoxV2);
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
                const value = await box2.retrieve();
                assert.equal(value, 'V2: 42');

        });

        it('Should throw an owner access update proxy error', async function () {
            const contractName = 'BoxUupsV2';

            const BoxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.zkWallet2, await boxUupsProxy.getAddress(), BoxV2),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER)
            );
        });

        it('Should allow other wallets to upgrade the contract', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow('Upgrading BoxUupsPublic to ' + contractName + '...'));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.zkWallet2, await boxUupsPublicProxy.getAddress(), BoxV2);
            await box2.waitForDeployment();
            console.info(chalk.green('Successfully upgraded BoxUupsPublic to BoxUupsV2'));
            //give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
                const value = await box2.retrieve();
                assert.equal(value, 'V2: 42');
        });

        it('Should throw a missing public upgradeTo error when deploying', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                    initializer: 'initialize',
                    kind: 'uups',
                }),
                (error: any) => error.message.includes(standaloneValidationErrors.MISSING_PUBLIC_UPGRADE_TO)
            );
        });

        it('Should throw a missing public upgradeTo error when upgrading', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow('Upgrading BoxUups to ' + contractName + '...'));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await boxUupsProxy.getAddress(), boxV2, {
                    kind: 'uups',
                }),
                (error:any) =>
                error.message.includes(standaloneValidationErrors.MISSING_PUBLIC_UPGRADE_TO) &&
                error.message.includes('is not upgrade safe'),
                'Expected error not thrown for missing upgradeTo function.'            );
        });
    });
    describe.skip('Test beacon proxy deployment and upgrade functionalities', async function () {
        useEnvironment('beacon-e2e');

        let beaconImplementation: Contract;
        let beaconProxy: Contract;

        before('Deploy beacon proxy and contract implementation', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow('Deploying ' + contractName + ' beacon proxy...'));

            const contract = await this.deployer.loadArtifact(contractName);
            beaconImplementation = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            beaconProxy = await this.env.zkUpgrades.deployBeaconProxy(
                this.deployer.zkWallet,
                //@ts-ignore
                beaconImplementation,
                contract,
                [42]
            );
            await beaconProxy.waitForDeployment();
        });

        it('Should deploy beacon proxy and contract implementation', async function () {
            await beaconProxy.waitForDeployment();
            beaconProxy.connect(this.deployer.zkWallet);
                const value = await beaconProxy.retrieve();
                assert.equal(value, 42n);
        });

        it('Should upgrade beacon proxy contract implementation', async function () {
            const implContractName = 'BoxV2';
            const boxV2Implementation = await this.deployer.loadArtifact(implContractName);

            await this.env.zkUpgrades.upgradeBeacon(
                this.deployer.zkWallet,
                await beaconImplementation.getAddress(),
                boxV2Implementation
            );

            const attachTo = new ContractFactory<any[],Contract>(
                boxV2Implementation.abi,
                boxV2Implementation.bytecode,
                this.deployer.zkWallet,
                this.deployer.deploymentType
            );
            const boxV2 = attachTo.attach(await beaconProxy.getAddress());

            boxV2.connect(this.deployer.zkWallet);
            //give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });
    describe.skip('Test upgradable contracts admin functionalities', async function () {
        useEnvironment('admin');
       
        const provider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);

        it('Should return the smart contract admin instance', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'store',
            });
            await deployedContract.waitForDeployment();

            const adminInstance = await this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet);
            const adminAddress = await adminInstance.getProxyAdmin(await deployedContract.getAddress());

            assert(await adminInstance.getAddress(), adminAddress);
        });

        it('Should fail to return the smart contract admin instance', async function () {
            // remove the manifest file to separate this test's manifest file from others
            await fsExtra.remove(path.join(this.env.config.paths.root, MANIFEST_DEFAULT_DIR));

            await assert.rejects(this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet), (error: any) =>
                error.message.includes(authorizationErrors.NO_PROXY_ADMIN_FOUND)
            );
        });

        it('Should change the admin of an upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const adminInstance = await this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet);
            await this.env.zkUpgrades.admin.changeProxyAdmin(
                await deployedContract.getAddress(),
                richWallets[1].address,
                this.deployer.zkWallet
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const updatedAdminInstance = await getAdminAddress(provider, await deployedContract.getAddress());

            assert(updatedAdminInstance !==await adminInstance.getAddress());
            assert(updatedAdminInstance, richWallets[1].address);
        });

        it('Should fail to upgrade the proxy without admin', async function () {
            const contractName = 'Box';
            const contractV2Name = 'BoxV2';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const contractV2 = await this.deployer.loadArtifact(contractV2Name);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const adminFactory = await getAdminFactory(this.env, this.zkWallet2);
            const newAdminContract = await deploy(adminFactory);

            await this.env.zkUpgrades.admin.changeProxyAdmin(
                await deployedContract.getAddress(),
                await newAdminContract.address,
                this.deployer.zkWallet
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await deployedContract.getAddress(), contractV2),
                (error: any) => error.message.includes(authorizationErrors.WRONG_PROXY_ADMIN)
            );
        });

        it('Should fail to change the admin - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.changeProxyAdmin(
                    await deployedContract.getAddress(),
                    richWallets[1].address,
                    this.zkWallet2
                ),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER)
            );
        });

        it('Should change the owner of the upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const admin = await getManifestAdmin(this.env, this.deployer.zkWallet);

            await this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.deployer.zkWallet);
            const newOwner = await admin.owner();

            assert(newOwner, TEST_ADDRESS);
        });

        it('Should fail to change the owner - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER)
            );
        });

        it('Should fail to change the owner - no admin', async function () {
            // remove the manifest file to separate this test's manifest file from others
            await fsExtra.remove(path.join(this.env.config.paths.root, MANIFEST_DEFAULT_DIR));

            await assert.rejects(
                this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2),
                (error: any) => error.message.includes(authorizationErrors.NO_PROXY_ADMIN_FOUND)
            );
        });
    });
    describe.skip('Test storage layout validations', async function () {
        useEnvironment('storage-layout-validations');

        let boxProxy: Contract;
        let boxWithStorageGap: Contract;

        before('Deploy Box and BoxWithStorageGap proxies', async function () {
            const contractName1 = 'Box';
            const contractName2 = 'BoxWithStorageGap';

            console.info(chalk.yellow('Deploying ' + contractName1 + '...'));

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            boxProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'store',
            });

            console.info(chalk.yellow('Deploying ' + contractName2 + '...'));

            const boxWithStorageGapArtifact = await this.deployer.loadArtifact(contractName2);
            boxWithStorageGap = await this.env.zkUpgrades.deployProxy(
                this.deployer.zkWallet,
                boxWithStorageGapArtifact,
                [42],
                {
                    initializer: 'store',
                }
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
        });

        it('Should upgrade Box proxy to compatible implementation', async function () {
            const contractName = 'BoxV2';
            console.info(chalk.yellow('Upgrading Box to ' + contractName + '...'));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);
            const boxV2 = await this.env.zkUpgrades.upgradeProxy(
                this.deployer.zkWallet,
                await boxProxy.getAddress(),
                boxV2Artifact
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should fail do upgrade proxy to the implementation that violates storage layout restrictions', async function () {
            const contractName = 'BoxV2Invalid';
            console.info(chalk.yellow('Upgrading Box to ' + contractName + '...'));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await boxProxy.getAddress(), boxV2),
                (error: any) =>
                    error.message.includes(storageLayoutErrors.INCOMPATIBLE_STORAGE_LAYOUT) &&
                    error.message.includes(storageLayoutErrors.INSERTED_VARIABLE) &&
                    error.message.includes(storageLayoutErrors.CHANGE_VARIABLE_TYPE) &&
                    error.message.includes(storageLayoutErrors.RENAMED_VARIABLE) &&
                    error.message.includes(storageLayoutErrors.DELETED_VARIABLE)
            );
        });

        it('Should fail do upgrade proxy to the implementation that does not reduce storage gap properly', async function () {
            const contractName = 'BoxWithStorageGapV2Invalid';
            console.info(chalk.yellow('Upgrading BoxWithStorageGap to ' + contractName + '...'));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, await boxWithStorageGap.getAddress(), boxV2Artifact),
                (error: any) =>
                    error.message.includes(storageLayoutErrors.INCOMPATIBLE_STORAGE_LAYOUT) &&
                    error.message.includes(storageLayoutErrors.STORAGE_GAP_SIZE)
            );
        });

        it('Should upgrade BoxWithStorageGap proxy to compatible implementation', async function () {
            const contractName = 'BoxWithStorageGapV2';
            console.info(chalk.yellow('Upgrading BoxWithStorageGap to ' + contractName + '...'));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);
            const boxV2 = await this.env.zkUpgrades.upgradeProxy(
                this.deployer.zkWallet,
                await boxWithStorageGap.getAddress(),
                boxV2Artifact
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });
    describe.skip('Test proxy gas estimation', async function () {
        useEnvironment('deployment-gas-estimation');
        const MINIMUM_GAS_LIMIT = 1000000000000000n; // 0.001 ETH

        it('Should estimate gas for transparent proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Estimating gas for ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasProxy(this.deployer, contract, [], {
                kind: 'transparent',
            });

            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });
            await box.waitForDeployment();

            const newBalance:bigint = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation>MINIMUM_GAS_LIMIT) assert(gasEstimation > balance-newBalance);
        });

        it('Should estimate gas for uups proxy deployment on local setup', async function () {
            const contractName = 'BoxUups';
            console.info(chalk.yellow('Estimating gas for ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation:bigint = await this.env.zkUpgrades.estimation.estimateGasProxy(
                this.deployer,
                contract,
                [],
                { kind: 'uups' },
                true
            );

            let box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
                kind: 'uups',
            });
           await box.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation> MINIMUM_GAS_LIMIT) assert(gasEstimation > balance - newBalance);
        });

        it('Should estimate gas for beacon contract deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Estimating gas for ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasBeacon(this.deployer, contract, []);

            const box = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await box.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation>(MINIMUM_GAS_LIMIT)) assert(gasEstimation > balance-newBalance);
        });

        it('Should estimate gas for beacon proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Estimating gas for ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimationBeacon:bigint = await this.env.zkUpgrades.estimation.estimateGasBeacon(
                this.deployer,
                contract,
                [],
                {},
                true
            );
            const gasEstimationProxy:bigint = await this.env.zkUpgrades.estimation.estimateGasBeaconProxy(
                this.deployer,
                [],
                {},
                true
            );
            const gasEstimation = gasEstimationBeacon+gasEstimationProxy;

            const boxBeacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            const boxProxy = await this.env.zkUpgrades.deployBeaconProxy(
                this.deployer.zkWallet,
                await boxBeacon.getAddress(),
                contract,
                [42]
            );
            await boxProxy.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation>MINIMUM_GAS_LIMIT) assert(gasEstimation >balance-newBalance);
        });
    });
});
