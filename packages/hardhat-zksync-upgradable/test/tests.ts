import assert from 'assert';
import { ContractFactory, Provider, Contract } from 'zksync-ethers';
import chalk from 'chalk';

import { getAdminAddress } from '@openzeppelin/upgrades-core';
import { ethers } from 'ethers';
import { LOCAL_SETUP_ZKSYNC_NETWORK } from '../src/constants';
import { deployBeacon, deployProxy, upgradeBeacon } from '../src/plugin';
import { deploy } from '../src/proxy-deployment/deploy';
import { getProxyAdminFactory } from '../src/utils/factories';
import { TEST_ADDRESS, standaloneValidationErrors, storageLayoutErrors } from './constants';
import richWallets from './rich-wallets.json';

import { useEnvironment } from './helpers';

describe('Upgradable plugin tests', async function () {
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e');

        let boxProxy: Contract;

        before('Deploy Box proxy and contract implementation', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow(`Deploying ${contractName} transparent proxy...`));

            const boxArtifact = await this.deployer.loadArtifact(contractName);
            boxProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'store',
            });
        });

        it('Should deploy proxy and contract implementation', async function () {
            await boxProxy.deployed();

            boxProxy.connect(this.deployer.zkWallet);
            const value = await boxProxy.retrieve();

            assert.equal(value.toNumber(), 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxV2';

            console.info(chalk.yellow(`Upgrading Box to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, boxProxy.address, BoxV2);

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();

            assert.equal(value, 'V2: 42');
        });

        it('Should fail to deploy proxy for implementation that is not upgrade safe', async function () {
            const contractName = 'BoxUpgradeUnsafe';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

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
                },
            );
        });
    });

    describe('Test UUPS proxy deployment and upgrade functionalities', async function () {
        useEnvironment('uups-e2e');

        let boxUupsProxy: Contract;
        let boxUupsPublicProxy: Contract;

        before('Deploy BoxUups and BoxUupsPublic proxy and contract implementation', async function () {
            const contractName1 = 'BoxUups';
            const contractName2 = 'BoxUupsPublic';

            console.info(chalk.yellow(`Deploying ${contractName1} uups proxy...`));

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            boxUupsProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'initialize',
                unsafeAllow: ['state-variable-assignment'],
            });

            await boxUupsProxy.deployed();

            console.info(chalk.yellow(`Deploying ${contractName2} uups proxy...`));

            const boxPublicArtifact = await this.deployer.loadArtifact(contractName2);
            boxUupsPublicProxy = await this.env.zkUpgrades.deployProxy(
                this.deployer.zkWallet,
                boxPublicArtifact,
                [42],
                {
                    initializer: 'initialize',
                    unsafeAllow: ['state-variable-assignment'],
                },
            );
            await boxUupsPublicProxy.deployed();
        });

        it('Should deploy uups proxy and contract implementation', async function () {
            await boxUupsProxy.deployed();

            boxUupsProxy.connect(this.deployer.zkWallet);
            const value = await boxUupsProxy.retrieve();

            assert.equal(value.toNumber(), 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow(`Upgrading BoxUups to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, boxUupsProxy.address, BoxV2, {
                unsafeAllow: ['state-variable-assignment'],
            });

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();

            assert.equal(value, 'V2: 42');
        });

        it('Should throw an owner access update proxy error', async function () {
            const contractName = 'BoxUupsV2';

            const BoxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.zkWallet2, boxUupsProxy.address, BoxV2, {
                    unsafeAllow: ['state-variable-assignment'],
                }),
            );
        });

        it.only('Should allow other wallets to upgrade the contract', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow(`Upgrading BoxUupsPublic to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(
                this.deployer.zkWallet,
                boxUupsPublicProxy.address,
                BoxV2,
                { unsafeAllow: ['state-variable-assignment'] },
            );
            console.info(chalk.green('Successfully upgraded BoxUupsPublic to BoxUupsV2'));

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();

            assert.equal(value, 'V2: 42');
        });

        it('Should throw a missing public upgradeTo error when deploying', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                    initializer: 'initialize',
                    kind: 'uups',
                    unsafeAllow: ['state-variable-assignment'],
                }),
            );
        });

        it('Should throw a missing public upgradeTo error when upgrading', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow(`Upgrading BoxUups to ${contractName}...`));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, boxUupsProxy.address, boxV2, {
                    kind: 'uups',
                    unsafeAllow: ['state-variable-assignment'],
                }),
            );
        });
    });

    describe('Test beacon proxy deployment and upgrade functionalities', async function () {
        useEnvironment('beacon-e2e');

        let beaconImplementation: Contract;
        let beaconProxy: Contract;

        before('Deploy beacon proxy and contract implementation', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow(`Deploying ${contractName} beacon proxy...`));

            const contract = await this.deployer.loadArtifact(contractName);
            beaconImplementation = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);

            beaconProxy = await this.env.zkUpgrades.deployBeaconProxy(
                this.deployer.zkWallet,
                beaconImplementation,
                contract,
                [42],
            );
        });

        it('Should deploy beacon proxy and contract implementation', async function () {
            await beaconProxy.deployed();

            beaconProxy.connect(this.deployer.zkWallet);
            const value = await beaconProxy.retrieve();

            assert(value.toNumber() === 42);
        });

        it('Should upgrade beacon proxy contract implementation', async function () {
            const implContractName = 'BoxV2';
            const boxV2Implementation = await this.deployer.loadArtifact(implContractName);

            await this.env.zkUpgrades.upgradeBeacon(
                this.deployer.zkWallet,
                beaconImplementation.address,
                boxV2Implementation,
            );

            const attachTo = new ContractFactory(
                boxV2Implementation.abi,
                boxV2Implementation.bytecode,
                this.deployer.zkWallet,
                this.deployer.deploymentType,
            );
            const boxV2 = attachTo.attach(beaconProxy.address);

            boxV2.connect(this.deployer.zkWallet);
            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const value = await boxV2.retrieve();

            assert(value === 'V2: 42');
        });
    });

    describe('Test upgradable contracts admin functionalities', async function () {
        useEnvironment('admin');
        const provider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);

        it('Should change the admin of an upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await this.env.zkUpgrades.admin.transferProxyAdminOwnership(
                deployedContract.address,
                richWallets[1].address,
                this.deployer.zkWallet,
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const updatedAdminInstance = await getAdminAddress(provider, deployedContract.address);

            assert(updatedAdminInstance, richWallets[1].address);
        });

        it('Should fail to upgrade the proxy without admin', async function () {
            const contractName = 'Box';
            const contractV2Name = 'BoxV2';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const contractV2 = await this.deployer.loadArtifact(contractV2Name);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const adminFactory = await getProxyAdminFactory(this.env, this.zkWallet2);
            const newAdminContract = await deploy(adminFactory, this.deployer.zkWallet.address);

            await this.env.zkUpgrades.admin.transferProxyAdminOwnership(
                deployedContract.address,
                newAdminContract.address,
                this.deployer.zkWallet,
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, deployedContract.address, contractV2),
            );
        });

        it('Should fail to change the admin - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.changeProxyAdmin(
                    deployedContract.address,
                    richWallets[1].address,
                    this.zkWallet2,
                ),
            );
        });

        it('Should change the owner of the upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });
            await proxy.deployed();

            await this.env.zkUpgrades.admin.transferProxyAdminOwnership(
                proxy.address,
                TEST_ADDRESS,
                this.deployer.zkWallet,
            );

            const savedAdmin = await getAdminAddress(provider, proxy.address);
            assert(savedAdmin, TEST_ADDRESS);
        });

        it('Should fail to change the owner - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.transferProxyAdminOwnership(proxy.adress, TEST_ADDRESS, this.zkWallet2),
            );
        });
    });

    describe('Test storage layout validations', async function () {
        useEnvironment('storage-layout-validations');

        let boxProxy: Contract;
        let boxWithStorageGap: Contract;

        before('Deploy Box and BoxWithStorageGap proxies', async function () {
            const contractName1 = 'Box';
            const contractName2 = 'BoxWithStorageGap';

            console.info(chalk.yellow(`Deploying ${contractName1}...`));

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            boxProxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, boxArtifact, [42], {
                initializer: 'store',
            });

            console.info(chalk.yellow(`Deploying ${contractName2}...`));

            const boxWithStorageGapArtifact = await this.deployer.loadArtifact(contractName2);
            boxWithStorageGap = await this.env.zkUpgrades.deployProxy(
                this.deployer.zkWallet,
                boxWithStorageGapArtifact,
                [42],
                {
                    initializer: 'store',
                },
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
        });

        it('Should upgrade Box proxy to compatible implementation', async function () {
            const contractName = 'BoxV2';
            console.info(chalk.yellow(`Upgrading Box to ${contractName}...`));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);
            const boxV2 = await this.env.zkUpgrades.upgradeProxy(
                this.deployer.zkWallet,
                boxProxy.address,
                boxV2Artifact,
            );

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should fail do upgrade proxy to the implementation that violates storage layout restrictions', async function () {
            const contractName = 'BoxV2Invalid';
            console.info(chalk.yellow(`Upgrading Box to ${contractName}...`));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, boxProxy.address, boxV2),
                (error: any) =>
                    error.message.includes(storageLayoutErrors.INCOMPATIBLE_STORAGE_LAYOUT) &&
                    error.message.includes(storageLayoutErrors.INSERTED_VARIABLE) &&
                    error.message.includes(storageLayoutErrors.CHANGE_VARIABLE_TYPE) &&
                    error.message.includes(storageLayoutErrors.RENAMED_VARIABLE) &&
                    error.message.includes(storageLayoutErrors.DELETED_VARIABLE),
            );
        });

        it('Should fail do upgrade proxy to the implementation that does not reduce storage gap properly', async function () {
            const contractName = 'BoxWithStorageGapV2Invalid';
            console.info(chalk.yellow(`Upgrading BoxWithStorageGap to ${contractName}...`));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, boxWithStorageGap.address, boxV2Artifact),
                (error: any) =>
                    error.message.includes(storageLayoutErrors.INCOMPATIBLE_STORAGE_LAYOUT) &&
                    error.message.includes(storageLayoutErrors.STORAGE_GAP_SIZE),
            );
        });

        it('Should upgrade BoxWithStorageGap proxy to compatible implementation', async function () {
            const contractName = 'BoxWithStorageGapV2';
            console.info(chalk.yellow(`Upgrading BoxWithStorageGap to ${contractName}...`));

            const boxV2Artifact = await this.deployer.loadArtifact(contractName);
            const boxV2 = await this.env.zkUpgrades.upgradeProxy(
                this.deployer.zkWallet,
                boxWithStorageGap.address,
                boxV2Artifact,
            );

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });

    describe('Test proxy gas estimation', async function () {
        useEnvironment('deployment-gas-estimation');

        const MINIMUM_GAS_LIMIT = ethers.BigNumber.from(1000000000000000); // 0.001 ETH

        it('Should estimate gas for transparent proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasProxy(this.deployer, contract, [], {
                kind: 'transparent',
            });

            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });
            await box.deployed();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation.gt(MINIMUM_GAS_LIMIT)) assert(gasEstimation > balance.sub(newBalance).toNumber());
        });

        it('Should estimate gas for uups proxy deployment on local setup', async function () {
            const contractName = 'BoxUups';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasProxy(
                this.deployer,
                contract,
                [],
                { kind: 'uups', unsafeAllow: ['state-variable-assignment'] },
                true,
            );

            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
                kind: 'uups',
                unsafeAllow: ['state-variable-assignment'],
            });
            await box.deployed();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation.gt(MINIMUM_GAS_LIMIT)) assert(gasEstimation > balance.sub(newBalance).toNumber());
        });

        it('Should estimate gas for beacon contract deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasBeacon(this.deployer, contract, []);

            const box = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await box.deployed();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation.gt(MINIMUM_GAS_LIMIT)) assert(gasEstimation > balance.sub(newBalance).toNumber());
        });

        it('Should estimate gas for beacon proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimationBeacon = await this.env.zkUpgrades.estimation.estimateGasBeacon(
                this.deployer,
                contract,
                [],
                {},
                true,
            );
            const gasEstimationProxy = await this.env.zkUpgrades.estimation.estimateGasBeaconProxy(
                this.deployer,
                [],
                {},
                true,
            );
            const gasEstimation = gasEstimationBeacon.add(gasEstimationProxy);

            const boxBeacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            const boxProxy = await this.env.zkUpgrades.deployBeaconProxy(
                this.deployer.zkWallet,
                boxBeacon.address,
                contract,
                [42],
            );
            await boxProxy.deployed();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation.gt(MINIMUM_GAS_LIMIT)) assert(gasEstimation > balance.sub(newBalance).toNumber());
        });
    });
});

describe('Test for upgrades from oneline', function () {
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e', 'zkSyncNetwork');

        it('Should deploy proxy contract with one line', async function () {
            const box = await deployProxy(this.env, {
                contractName: 'Box',
                constructorArgsParams: [42],
            });

            const value = await box.retrieve();
            assert.equal(value, 42n);
        });
    });

    describe('Test UUPS proxy deployment and upgrade functionalities', async function () {
        useEnvironment('uups-e2e', 'zkSyncNetwork');

        it('Should deploy proxy contract with one line', async function () {
            const box = await deployProxy(this.env, {
                contractName: 'BoxUups',
                constructorArgsParams: [42],
                unsafeStateVariableAssignment: true,
            });

            const value = await box.retrieve();
            assert.equal(value, 42);
        });
    });

    describe('Test beacon proxy deployment and upgrade functionalities', async function () {
        useEnvironment('beacon-e2e', 'zkSyncNetwork');

        it('Should deploy proxy contract with one line', async function () {
            const { proxy, beacon } = await deployBeacon(this.env, {
                contractName: 'Box',
                constructorArgsParams: [42],
            });

            const value = await proxy.retrieve();
            assert.equal(value, 42n);

            const _ = await upgradeBeacon(this.env, {
                contractName: 'BoxV2',
                beaconAddress: beacon.address,
            });
        });
    });
});
