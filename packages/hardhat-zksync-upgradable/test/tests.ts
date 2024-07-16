import assert from 'assert';
import { ContractFactory, Provider, Contract } from 'zksync-ethers';
import chalk from 'chalk';
import fsExtra from 'fs-extra';
import path from 'path';

import { getAdminAddress } from '@openzeppelin/upgrades-core';
import { getArtifactFromBytecode } from '../src/utils/utils-general';
import { LOCAL_SETUP_ZKSYNC_NETWORK, MANIFEST_DEFAULT_DIR } from '../src/constants';
import { getAdminFactory } from '../src/proxy-deployment/deploy-proxy-admin';
import { deploy } from '../src/proxy-deployment/deploy';
import { getManifestAdmin } from '../src/admin';
import { deployBeacon, deployProxy, upgradeBeacon } from '../src/plugin';
import { TEST_ADDRESS, authorizationErrors, standaloneValidationErrors, storageLayoutErrors } from './constants';
import richWallets from './rich-wallets.json';

import { useEnvironment } from './helpers';

import '../src/type-extensions';

describe('Upgradable plugin tests', function () {
    describe('getArtifactFromBytecode', function () {
        useEnvironment('tup-e2e');
        it('should return the artifact that matches the bytecode', async function () {
            const bytecode =
                '0x0001000000000002000500000000000200000000000103550000008004000039000000400040043f00000001002001900000001c0000c13d000000000201001900000060022002700000002d02200197000000040020008c0000005e0000413d000000000301043b000000e0033002700000002f0030009c000000240000613d000000300030009c000000480000613d000000310030009c0000005e0000c13d0000000001000416000000000001004b0000005e0000c13d0000000101000039000000000101041a000000800010043f0000003d01000041000000ae0001042e0000000001000416000000000001004b0000005e0000c13d0000002001000039000001000010044300000120000004430000002e01000041000000ae0001042e000000240020008c0000005e0000413d0000000002000416000000000002004b0000005e0000c13d0000000003000415000000050330008a0000000503300210000000000500041a0000ff0002500190000000600000c13d0000000003000415000000040330008a0000000503300210000000ff00500190000000600000c13d0000000401100370000000000101043b0000000103000039000000000013041b000000380150019700000001011001bf000000000010041b00000000003404350000002d0040009c0000002d04008041000000400140021000000000020004140000002d0020009c0000002d02008041000000c002200210000000000112019f00000039011001c70000800d020000390000003a04000041000000590000013d000000240020008c0000005e0000413d0000000002000416000000000002004b0000005e0000c13d0000000401100370000000000101043b0000000103000039000000000013041b000000800010043f00000000010004140000002d0010009c0000002d01008041000000c0011002100000003b011001c70000800d020000390000003c0400004100ad00a30000040f00000001002001900000005e0000613d0000000001000019000000ae0001042e0000000001000019000000af00010430000300000003001d000100000002001d000200000005001d000000320100004100000000001004390000000001000410000000040010044300000000010004140000002d0010009c0000002d01008041000000c00110021000000033011001c7000080020200003900ad00a80000040f0000000100200190000000840000613d000000000101043b000000000001004b000000850000c13d0000000205000029000000ff0150018f000000010010008c0000000001000019000000010100603900000003020000290000000502200270000000000201001f000000880000c13d0000003e0150019700000001011001bf000000000010041b0000000001000367000000010000006b0000009c0000c13d000000400400043d000000340000013d000000000001042f00000003010000290000000501100270000000000100001f000000400100043d00000064021000390000003403000041000000000032043500000044021000390000003503000041000000000032043500000024021000390000002e030000390000000000320435000000360200004100000000002104350000000402100039000000200300003900000000003204350000002d0010009c0000002d01008041000000400110021000000037011001c7000000af000104300000000401100370000000000101043b0000000102000039000000000012041b0000000001000019000000ae0001042e000000000001042f000000a6002104210000000102000039000000000001042d0000000002000019000000000001042d000000ab002104230000000102000039000000000001042d0000000002000019000000000001042d000000ad00000432000000ae0001042e000000af00010430000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ffffffff000000020000000000000000000000000000004000000100000000000000000000000000000000000000000000000000000000000000000000000000fe4b84df000000000000000000000000000000000000000000000000000000006057361d000000000000000000000000000000000000000000000000000000002e64cec11806aa1896bbf26568e884a7374b41e002500962caba6a15023a8d90e8508b830200000200000000000000000000000000000024000000000000000000000000647920696e697469616c697a6564000000000000000000000000000000000000496e697469616c697a61626c653a20636f6e747261637420697320616c72656108c379a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000002000000000000000000000000000000000000200000000000000000000000007f26b83ff96e1f2b6a682f133852f6798a09c465da95921460cefb3847402498020000000000000000000000000000000000002000000080000000000000000093fe6d397c74fdf1402a8b72e47b68512f0510d7b98a4bc4cbdf6ac7108b3c590000000000000000000000000000000000000020000000800000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000000000000000000000cd0d77e95234fd8ac16582d45c7561a19c338b3ec23266ea8a5caae4f25f62d4';
            const artifact = await getArtifactFromBytecode(this.env, bytecode);
            assert.equal(artifact.bytecode, bytecode);
        });

        it('should throw an error if no artifact matches the bytecode', async function () {
            const bytecode = '0x789';
            await assert.rejects(async () => {
                await getArtifactFromBytecode(this.env, bytecode);
            }, /Artifact for provided bytecode is not found./);
        });
    });
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e');

        let boxProxy: Contract;

        before('Deploy Box proxy and contract implementation', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow(`Deploying ${contractName} transparent proxy...`));

            const boxArtifact = await this.deployer.loadArtifact(contractName);
            boxProxy = await this.env.zkUpgrades.deployProxy(boxArtifact, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });
            await boxProxy.waitForDeployment();
        });

        it('Deploy Box proxy and contract implementation using factory', async function () {
            const contractName = 'Box';

            console.info(chalk.yellow(`Deploying ${contractName} transparent proxy...`));

            const boxArtifact = await this.deployer.loadArtifact(contractName);
            const boxArtifactFactory = new ContractFactory(
                boxArtifact.abi,
                boxArtifact.bytecode,
                this.deployer.zkWallet,
            );
            const boxProxyInner = await this.env.zkUpgrades.deployProxy(boxArtifactFactory, [42], {
                initializer: 'initialize',
            });
            await boxProxyInner.waitForDeployment();
        });

        it('Should deploy proxy and contract implementation', async function () {
            await boxProxy.waitForDeployment();
            boxProxy.connect(this.deployer.zkWallet);
            const value = await boxProxy.retrieve();
            assert.equal(value, 42n);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxV2';

            console.info(chalk.yellow(`Upgrading Box to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(
                await boxProxy.getAddress(),
                BoxV2,
                this.deployer.zkWallet,
            );
            await box2.waitForDeployment();
            // give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should fail to deploy proxy for implementation that is not upgrade safe', async function () {
            const contractName = 'BoxUpgradeUnsafe';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
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

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            boxUupsProxy = await this.env.zkUpgrades.deployProxy(boxArtifact, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });
            await boxUupsProxy.waitForDeployment();

            console.info(chalk.yellow(`Deploying ${contractName2} uups proxy...`));

            const boxPublicArtifact = await this.deployer.loadArtifact(contractName2);
            boxUupsPublicProxy = await this.env.zkUpgrades.deployProxy(
                boxPublicArtifact,
                this.deployer.zkWallet,
                [42],
                {
                    initializer: 'initialize',
                },
            );
            await boxUupsPublicProxy.waitForDeployment();
        });

        it('Deploy BoxUups and BoxUupsPublic proxy and contract implementation using factory', async function () {
            const contractName1 = 'BoxUups';
            const contractName2 = 'BoxUupsPublic';

            const boxArtifact = await this.deployer.loadArtifact(contractName1);
            const boxArtifactFactory = new ContractFactory(
                boxArtifact.abi,
                boxArtifact.bytecode,
                this.deployer.zkWallet,
            );
            const boxUupsProxyInner = await this.env.zkUpgrades.deployProxy(boxArtifactFactory, [42], {
                initializer: 'initialize',
            });
            await boxUupsProxyInner.waitForDeployment();

            console.info(chalk.yellow(`Deploying ${contractName2} uups proxy...`));

            const boxPublicArtifact = await this.deployer.loadArtifact(contractName2);
            const boxUupsPublicProxyInner = await this.env.zkUpgrades.deployProxy(
                boxPublicArtifact,
                this.deployer.zkWallet,
                [42],
                {
                    initializer: 'initialize',
                },
            );
            await boxUupsPublicProxyInner.waitForDeployment();
        });

        it('Should deploy uups proxy and contract implementation', async function () {
            await boxUupsProxy.waitForDeployment();
            // await new Promise((resolve) => setTimeout(resolve, 1500));
            boxUupsProxy.connect(this.deployer.zkWallet);
            const value = await boxUupsProxy.retrieve();

            assert.equal(value, 42);
        });

        it('Should update proxy contract implementation', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow(`Upgrading BoxUups to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(
                await boxUupsProxy.getAddress(),
                BoxV2,
                this.deployer.zkWallet,
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should throw an owner access update proxy error', async function () {
            const contractName = 'BoxUupsV2';

            const BoxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(await boxUupsProxy.getAddress(), BoxV2, this.zkWallet2),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER),
            );
        });

        it('Should allow other wallets to upgrade the contract', async function () {
            const contractName = 'BoxUupsV2';

            console.info(chalk.yellow(`Upgrading BoxUupsPublic to ${contractName}...`));

            const BoxV2 = await this.deployer.loadArtifact(contractName);
            const box2 = await this.env.zkUpgrades.upgradeProxy(
                await boxUupsPublicProxy.getAddress(),
                BoxV2,
                this.zkWallet2,
            );
            await box2.waitForDeployment();
            console.info(chalk.green('Successfully upgraded BoxUupsPublic to BoxUupsV2'));
            // give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 1500));
            box2.connect(this.deployer.zkWallet);
            const value = await box2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should throw a missing public upgradeTo error when deploying', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                    initializer: 'initialize',
                    kind: 'uups',
                }),
                (error: any) => error.message.includes(standaloneValidationErrors.MISSING_PUBLIC_UPGRADE_TO),
            );
        });

        it('Should throw a missing public upgradeTo error when upgrading', async function () {
            const contractName = 'BoxUupsMissingUpgradeTo';
            console.info(chalk.yellow(`Upgrading BoxUups to ${contractName}...`));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(await boxUupsProxy.getAddress(), boxV2, this.deployer.zkWallet, {
                    kind: 'uups',
                }),
                (error: any) =>
                    error.message.includes(standaloneValidationErrors.MISSING_PUBLIC_UPGRADE_TO) &&
                    error.message.includes('is not upgrade safe'),
                'Expected error not thrown for missing upgradeTo function.',
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
            beaconImplementation = await this.env.zkUpgrades.deployBeacon(contract, this.deployer.zkWallet);
            beaconProxy = await this.env.zkUpgrades.deployBeaconProxy(
                beaconImplementation,
                contract,
                this.deployer.zkWallet,
                [42],
                {},
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
                await beaconImplementation.getAddress(),
                boxV2Implementation,
                this.deployer.zkWallet,
            );

            const attachTo = new ContractFactory<any[], Contract>(
                boxV2Implementation.abi,
                boxV2Implementation.bytecode,
                this.deployer.zkWallet,
                this.deployer.deploymentType,
            );
            const boxV2 = attachTo.attach(await beaconProxy.getAddress());

            boxV2.connect(this.deployer.zkWallet);
            // give it some time to upgrade
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });
    describe('Test upgradable contracts admin functionalities', async function () {
        useEnvironment('admin');

        const provider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);

        it('Should return the smart contract admin instance', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
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
                error.message.includes(authorizationErrors.NO_PROXY_ADMIN_FOUND),
            );
        });

        it('Should change the admin of an upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });

            const adminInstance = await this.env.zkUpgrades.admin.getInstance(this.deployer.zkWallet);
            await this.env.zkUpgrades.admin.changeProxyAdmin(
                await deployedContract.getAddress(),
                richWallets[1].address,
                this.deployer.zkWallet,
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const updatedAdminInstance = await getAdminAddress(provider, await deployedContract.getAddress());

            assert(updatedAdminInstance !== (await adminInstance.getAddress()));
            assert(updatedAdminInstance, richWallets[1].address);
        });

        it('Should fail to upgrade the proxy without admin', async function () {
            const contractName = 'Box';
            const contractV2Name = 'BoxV2';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const contractV2 = await this.deployer.loadArtifact(contractV2Name);
            const deployedContract = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });

            const adminFactory = await getAdminFactory(this.env, this.zkWallet2);
            const newAdminContract = await deploy(adminFactory);

            await this.env.zkUpgrades.admin.changeProxyAdmin(
                await deployedContract.getAddress(),
                newAdminContract.address,
                this.deployer.zkWallet,
            );

            // wait 2 seconds before the next call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(
                    await deployedContract.getAddress(),
                    contractV2,
                    this.deployer.zkWallet,
                ),
                (error: any) => error.message.includes(authorizationErrors.WRONG_PROXY_ADMIN),
            );
        });

        it('Should fail to change the admin - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const deployedContract = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.changeProxyAdmin(
                    await deployedContract.getAddress(),
                    richWallets[1].address,
                    this.zkWallet2,
                ),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER),
            );
        });

        it('Should change the owner of the upgradable smart contract', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });

            const admin = await getManifestAdmin(this.env, this.deployer.zkWallet);

            await this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.deployer.zkWallet);
            const newOwner = await admin.owner();

            assert(newOwner, TEST_ADDRESS);
        });

        it('Should fail to change the owner - wrong signer', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Deploying ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });

            await assert.rejects(
                this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2),
                (error: any) => error.message.includes(authorizationErrors.CALLER_NOT_OWNER),
            );
        });

        it('Should fail to change the owner - no admin', async function () {
            // remove the manifest file to separate this test's manifest file from others
            await fsExtra.remove(path.join(this.env.config.paths.root, MANIFEST_DEFAULT_DIR));

            await assert.rejects(
                this.env.zkUpgrades.admin.transferProxyAdminOwnership(TEST_ADDRESS, this.zkWallet2),
                (error: any) => error.message.includes(authorizationErrors.NO_PROXY_ADMIN_FOUND),
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
            boxProxy = await this.env.zkUpgrades.deployProxy(boxArtifact, this.deployer.zkWallet, [42], {
                initializer: 'store',
            });

            console.info(chalk.yellow(`Deploying ${contractName2}...`));

            const boxWithStorageGapArtifact = await this.deployer.loadArtifact(contractName2);
            boxWithStorageGap = await this.env.zkUpgrades.deployProxy(
                boxWithStorageGapArtifact,
                this.deployer.zkWallet,
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
                await boxProxy.getAddress(),
                boxV2Artifact,
                this.deployer.zkWallet,
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });

        it('Should fail do upgrade proxy to the implementation that violates storage layout restrictions', async function () {
            const contractName = 'BoxV2Invalid';
            console.info(chalk.yellow(`Upgrading Box to ${contractName}...`));

            const boxV2 = await this.deployer.loadArtifact(contractName);

            await assert.rejects(
                this.env.zkUpgrades.upgradeProxy(await boxProxy.getAddress(), boxV2, this.deployer.zkWallet),
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
                this.env.zkUpgrades.upgradeProxy(
                    await boxWithStorageGap.getAddress(),
                    boxV2Artifact,
                    this.deployer.zkWallet,
                ),
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
                await boxWithStorageGap.getAddress(),
                boxV2Artifact,
                this.deployer.zkWallet,
            );
            await new Promise((resolve) => setTimeout(resolve, 1500));

            boxV2.connect(this.deployer.zkWallet);
            const value = await boxV2.retrieve();
            assert.equal(value, 'V2: 42');
        });
    });
    describe('Test proxy gas estimation', async function () {
        useEnvironment('deployment-gas-estimation');
        const MINIMUM_GAS_LIMIT = 1000000000000000n; // 0.001 ETH

        it('Should estimate gas for transparent proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasProxy(this.deployer, contract, [], {
                kind: 'transparent',
            });

            const box = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
            });
            await box.waitForDeployment();

            const newBalance: bigint = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation > MINIMUM_GAS_LIMIT) assert(gasEstimation > balance - newBalance);
        });

        it('Should estimate gas for uups proxy deployment on local setup', async function () {
            const contractName = 'BoxUups';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation: bigint = await this.env.zkUpgrades.estimation.estimateGasProxy(
                this.deployer,
                contract,
                [],
                { kind: 'uups' },
                true,
            );

            const box = await this.env.zkUpgrades.deployProxy(contract, this.deployer.zkWallet, [42], {
                initializer: 'initialize',
                kind: 'uups',
            });
            await box.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation > MINIMUM_GAS_LIMIT) assert(gasEstimation > balance - newBalance);
        });

        it('Should estimate gas for beacon contract deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimation = await this.env.zkUpgrades.estimation.estimateGasBeacon(this.deployer, contract, []);

            const box = await this.env.zkUpgrades.deployBeacon(contract, this.deployer.zkWallet);
            await box.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation > MINIMUM_GAS_LIMIT) assert(gasEstimation > balance - newBalance);
        });

        it('Should estimate gas for beacon proxy deployment on local setup', async function () {
            const contractName = 'Box';
            console.info(chalk.yellow(`Estimating gas for ${contractName}...`));

            const contract = await this.deployer.loadArtifact(contractName);
            const balance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            const gasEstimationBeacon: bigint = await this.env.zkUpgrades.estimation.estimateGasBeacon(
                this.deployer,
                contract,
                [],
                {},
                true,
            );
            const gasEstimationProxy: bigint = await this.env.zkUpgrades.estimation.estimateGasBeaconProxy(
                this.deployer,
                [],
                {},
                true,
            );
            const gasEstimation = gasEstimationBeacon + gasEstimationProxy;

            const boxBeacon = await this.env.zkUpgrades.deployBeacon(contract, this.deployer.zkWallet);
            const boxProxy = await this.env.zkUpgrades.deployBeaconProxy(
                await boxBeacon.getAddress(),
                contract,
                this.deployer.zkWallet,
                [42],
                {},
            );
            await boxProxy.waitForDeployment();

            const newBalance = await this.deployer.zkWallet.provider.getBalance(this.deployer.zkWallet.address);

            if (gasEstimation > MINIMUM_GAS_LIMIT) assert(gasEstimation > balance - newBalance);
        });
    });
});

describe('Test for upgrades for shortcuts commands', function () {
    describe('Test transparent upgradable proxy deployment and upgrade functionalities', async function () {
        useEnvironment('tup-e2e', 'zkSyncNetwork');

        it('Should deploy proxy contract', async function () {
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

        it('Should deploy proxy contract', async function () {
            const box = await deployProxy(this.env, {
                contractName: 'BoxUups',
                constructorArgsParams: [42],
            });

            const value = await box.retrieve();
            assert.equal(value, 42);
        });
    });

    describe('Test beacon proxy deployment and upgrade functionalities', async function () {
        useEnvironment('beacon-e2e', 'zkSyncNetwork');

        it('Should deploy proxy contract', async function () {
            const { proxy, beacon } = await deployBeacon(this.env, {
                contractName: 'Box',
                constructorArgsParams: [42],
            });

            const value = await proxy.retrieve();
            assert.equal(value, 42n);

            const _ = await upgradeBeacon(this.env, {
                contractName: 'BoxV2',
                beaconAddress: await beacon.getAddress(),
            });
        });
    });
});
