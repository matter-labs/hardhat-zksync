import { assert, expect } from 'chai';
import { useEnvironment } from './helpers';
import { ContractFactory, Provider } from 'zksync-web3';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import path from 'path';

import {
    CALLER_NOT_OWNER_ERROR,
    LOCAL_SETUP_RICH_WALLET_ADDRESS,
    NO_PROXY_ADMIN_FOUND_ERROR,
    TEST_ADDRESS,
    WRONG_PROXY_ADMIN_ERROR,
} from './constants';
import { LOCAL_SETUP_ZKSYNC_NETWORK, MANIFEST_DEFAULT_DIR } from '../src/constants';
import { getManifestAdmin } from '../src/admin';

import { getAdminAddress } from '@openzeppelin/upgrades-core';

describe('Upgradable plugin tests', async function () {
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e', 'hardhat');

        it('Should deploy proxy and contract implementation', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'store',
            });

            await box.deployed();

            box.connect(this.deployer.zkWallet);
            const value = await box.retrieve();
            console.info(chalk.green('Box value is: ', value.toNumber()));
            assert.equal(value.toNumber(), 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName1 = 'Box';
            const contractName2 = 'BoxV2';
            console.info(chalk.yellow('Deploying ' + contractName1 + '...'));

            const contract = await this.deployer.loadArtifact(contractName1);
            const box1Proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'store',
            });

            const BoxV2 = await this.deployer.loadArtifact(contractName2);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, box1Proxy.address, BoxV2);
            console.info(chalk.green('Successfully upgraded Box to BoxV2'));

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });

    describe('Test UUPS proxy deployment and upgrade functionalities', async function () {
        useEnvironment('uups-e2e', 'hardhat');
        it('Should deploy uups proxy and contract implementation', async function () {
            const contractName = 'BoxUups';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const box = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            await box.deployed();

            box.connect(this.deployer.zkWallet);
            const value = await box.retrieve();
            console.info(chalk.green('Box value is: ', value.toNumber()));
            assert.equal(value.toNumber(), 42);
        });
        it('Should update proxy contract implementation', async function () {
            const contractName1 = 'BoxUups';
            const contractName2 = 'BoxUupsV2';
            console.info(chalk.yellow('Deploying ' + contractName1 + '...'));

            const contract = await this.deployer.loadArtifact(contractName1);
            const box1Proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const BoxV2 = await this.deployer.loadArtifact(contractName2);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, box1Proxy.address, BoxV2);
            console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });
        it('Should throw an owner access update proxy error', async function () {
            const contractName1 = 'BoxUups';
            const contractName2 = 'BoxUupsV2';
            console.info(chalk.yellow('Deploying ' + contractName1 + '...'));

            const contract = await this.deployer.loadArtifact(contractName1);
            const box1Proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            try {
                const BoxV2 = await this.deployer.loadArtifact(contractName2);
                await this.env.zkUpgrades.upgradeProxy(this.zkWallet2, box1Proxy.address, BoxV2);
            } catch (error: any) {
                expect(error.message).to.contain(CALLER_NOT_OWNER_ERROR);
            }
        });
        it('Should allow other wallets to upgrade the contract', async function () {
            const contractName1 = 'BoxUupsPublic';
            const contractName2 = 'BoxUupsV2';
            console.info(chalk.yellow('Deploying ' + contractName1 + '...'));

            const contract = await this.deployer.loadArtifact(contractName1);
            const box1Proxy = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const BoxV2 = await this.deployer.loadArtifact(contractName2);
            const box2 = await this.env.zkUpgrades.upgradeProxy(this.zkWallet2, box1Proxy.address, BoxV2);
            console.info(chalk.green('Successfully upgraded BoxUupsPublic to BoxUupsV2'));

            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });

    describe('Test beacon proxy deployment and upgrade functionalities', async function () {
        useEnvironment('beacon-e2e', 'hardhat');
        it('Should deploy beacon proxy and contract implementation', async function () {
            const contractName = 'Box';
            const contract = await this.deployer.loadArtifact(contractName);

            const beacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await beacon.deployed();
            console.info(chalk.green('Beacon deployed to:', beacon.address));

            const box = await this.env.zkUpgrades.deployBeaconProxy(this.deployer.zkWallet, beacon, contract, [42]);
            await box.deployed();

            box.connect(this.deployer.zkWallet);
            const value = await box.retrieve();
            assert(value.toNumber() === 42);
        });

        it('Should upgrade beacon proxy contract implementation ', async function () {
            const contractName = 'Box';
            const contract = await this.deployer.loadArtifact(contractName);

            const beacon = await this.env.zkUpgrades.deployBeacon(this.deployer.zkWallet, contract);
            await beacon.deployed();
            console.info(chalk.green('Beacon deployed to:', beacon.address));

            const beaconProxy = await this.env.zkUpgrades.deployBeaconProxy(this.deployer.zkWallet, beacon, contract, [
                42,
            ]);
            await beaconProxy.deployed();

            const implContractName = 'BoxV2';
            const boxV2Implementation = await this.deployer.loadArtifact(implContractName);

            await this.env.zkUpgrades.upgradeBeacon(this.deployer.zkWallet, beacon.address, boxV2Implementation);

            const attachTo = new ContractFactory(
                boxV2Implementation.abi,
                boxV2Implementation.bytecode,
                this.deployer.zkWallet,
                this.deployer.deploymentType
            );
            const box = await attachTo.attach(beaconProxy.address);

            box.connect(this.deployer.zkWallet);
            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const value = await box.retrieve();
            assert(value === 'V2: 42');
        });
    });

    describe('Test upgradable contracts admin functionalities', async function () {
        useEnvironment('admin', 'hardhat');
        const provider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);

        it('Should return the smart contract admin instance', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            const adminInstance = await this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet);
            const adminAddress = await adminInstance.getProxyAdmin(deployedContract.address);

            assert(adminInstance.address, adminAddress);
        });

        it('Should fail to return the smart contract admin instance', async function () {
            // remove the manifest file to separate this test's manifest file from others
            await fsExtra.remove(path.join(this.env.config.paths.root, MANIFEST_DEFAULT_DIR));

            try {
                await this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet);
            } catch (error: any) {
                expect(error.message).to.contain(NO_PROXY_ADMIN_FOUND_ERROR);
            }
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
                deployedContract.address,
                LOCAL_SETUP_RICH_WALLET_ADDRESS,
                this.deployer.zkWallet
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const updatedAdminInstance = await getAdminAddress(provider, deployedContract.address);

            assert(updatedAdminInstance !== adminInstance.address);
            assert(updatedAdminInstance, LOCAL_SETUP_RICH_WALLET_ADDRESS);
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

            await this.env.zkUpgrades.admin.changeProxyAdmin(
                deployedContract.address,
                LOCAL_SETUP_RICH_WALLET_ADDRESS,
                this.deployer.zkWallet
            );

            try {
                this.env.zkUpgrades.upgradeProxy(this.deployer.zkWallet, deployedContract.address, contractV2);
            } catch (error: any) {
                expect(error.message).to.contain(WRONG_PROXY_ADMIN_ERROR);
            }
        });

        it('Should fail to change the admin - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
                initializer: 'initialize',
            });

            try {
                await this.env.zkUpgrades.admin.changeProxyAdmin(
                    deployedContract.address,
                    LOCAL_SETUP_RICH_WALLET_ADDRESS,
                    this.zkWallet2
                );
            } catch (error: any) {
                expect(error.message).to.contain(CALLER_NOT_OWNER_ERROR);
            }
        });
        it('Should change the owner of the upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow('Deploying ' + contractName + '...'));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(this.deployer.zkWallet, contract, [42], {
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

            try {
                await this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2);
            } catch (error: any) {
                expect(error.message).to.contain(CALLER_NOT_OWNER_ERROR);
            }
        });

        it('Should fail to change the owner - no admin', async function () {
            // remove the manifest file to separate this test's manifest file from others
            await fsExtra.remove(path.join(this.env.config.paths.root, MANIFEST_DEFAULT_DIR));

            try {
                await this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2);
            } catch (error: any) {
                expect(error.message).to.contain(NO_PROXY_ADMIN_FOUND_ERROR);
            }
        });
    });
});
