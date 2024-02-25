import chalk from 'chalk';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

import * as hre from 'hardhat';
import { Contract } from 'ethers';
import * as zk from 'zksync-ethers';
import { TASK_VERIFY, ZKSYNC_SEPOLIA_CHAIN_ID, useEnvironment } from './helpers';

describe('verify upgradable smart contracts', async function () {
    useEnvironment();

    it('Deploy and verify box beacon', async function () {
        const contractName = 'Box';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);

        const deployer = new Deployer(hre, zkWallet);

        const boxContract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
        await beacon.waitForDeployment();

        const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, await beacon.getAddress(), boxContract, [
            42,
        ]);
        await box.waitForDeployment();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = hre.run(TASK_VERIFY, { address: await box.getAddress() });
        }
    });

    it('Deploy and verify box proxy', async function () {
        const contractName = 'Box';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

        await box.waitForDeployment();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await box.getAddress() });
        }
    });

    it('Deploy and verify box uups', async function () {
        const contractName = 'BoxUups';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

        await box.waitForDeployment();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await box.getAddress() });
        }
    });

    it('Deploy, upgrade and verify box becaon', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        // deploy beacon proxy

        const contractName = 'Box';
        const contract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
        await beacon.waitForDeployment();

        const beaconAddress = await beacon.getAddress();

        const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beaconAddress, contract, [42]);
        await boxBeaconProxy.waitForDeployment();

        // upgrade beacon

        const boxV2Implementation = await deployer.loadArtifact('BoxV2');
        await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beaconAddress, boxV2Implementation);
        console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ', beaconAddress));

        const attachTo = new zk.ContractFactory<any[], Contract>(
            boxV2Implementation.abi,
            boxV2Implementation.bytecode,
            deployer.zkWallet,
            deployer.deploymentType,
        );
        const upgradedBox = attachTo.attach(await boxBeaconProxy.getAddress());

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('New box value is', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedBox.getAddress() });
        }
    });

    it('Deploy, upgrade and verify box uups', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        // deploy proxy
        const contractName = 'BoxUups';

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

        await box.waitForDeployment();

        // upgrade proxy implementation

        const BoxUupsV2 = await deployer.loadArtifact('BoxUupsV2');
        const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, await box.getAddress(), BoxUupsV2);
        console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('BoxUups value is', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedBox.getAddress() });
        }
    });

    it('Deploy, upgrade and verify box', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);
        // deploy proxy
        const contractName = 'Box';

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

        await box.waitForDeployment();

        // upgrade proxy implementation

        const BoxV2 = await deployer.loadArtifact('BoxV2');
        const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, await box.getAddress(), BoxV2);
        console.info(chalk.green('Successfully upgraded Box to BoxV2'));

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('Box value is', value));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedBox.getAddress() });
        }
    });

    it('Deploy factory beacon', async function () {
        const contractName = 'Factory';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        const factoryContract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, factoryContract);
        await beacon.waitForDeployment();

        const factory = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, factoryContract, []);
        await factory.waitForDeployment();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await factory.getAddress() });
        }
    });

    it('Deploy factory proxy', async function () {
        const contractName = 'Factory';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });
        await factory.waitForDeployment();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await factory.getAddress() });
        }
    });

    it('Deploy factory uups', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        const contractName = 'Factory';
        const contract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
        await beacon.waitForDeployment();

        const factoryBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, []);
        await factoryBeaconProxy.waitForDeployment();

        // upgrade beacon

        const factoryV2Implementation = await deployer.loadArtifact('FactoryV2');
        await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, await beacon.getAddress(), factoryV2Implementation);
        console.info(chalk.green('Successfully upgraded beacon Factory to FactoryV2 on address: ', beacon.address));

        const attachTo = new zk.ContractFactory(
            factoryV2Implementation.abi,
            factoryV2Implementation.bytecode,
            deployer.zkWallet,
            deployer.deploymentType,
        );
        const upgradedFactory = attachTo.attach(await factoryBeaconProxy.getAddress()) as Contract;
        upgradedFactory.connect(zkWallet);
        const number = await upgradedFactory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedFactory.getAddress() });
        }
    });

    it('Deploy factory, upgrade and verify beacon', async function () {
        const contractName = 'FactoryUups';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = await hre.zksyncEthers.getWallet(0);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.waitForDeployment();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }
        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await factory.getAddress() });
        }
    });

    it('Deploy factory, upgrade and verify uups', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        // deploy proxy
        const contractName = 'FactoryUups';

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.waitForDeployment();

        // upgrade proxy implementation

        const FactoryUupsV2 = await deployer.loadArtifact('FactoryUupsV2');
        const upgradedFactory = await hre.zkUpgrades.upgradeProxy(
            deployer.zkWallet,
            await factory.getAddress(),
            FactoryUupsV2,
        );
        console.info(chalk.green('Successfully upgraded FactoryUups to FactoryUupsV2'));

        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedFactory.getAddress() });
        }
    });

    it('Deploy factory, upgrade and verify', async function () {
        const zkWallet = await hre.zksyncEthers.getWallet(0);
        const deployer = new Deployer(hre, zkWallet);

        const contractName = 'Factory';

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.waitForDeployment();

        const FactoryV2 = await deployer.loadArtifact('FactoryV2');
        const upgradedFactory = await hre.zkUpgrades.upgradeProxy(
            deployer.zkWallet,
            await factory.getAddress(),
            FactoryV2,
        );
        console.info(chalk.green('Successfully upgraded Factory to FactoryV2'));

        upgradedFactory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }
        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (chainId === ZKSYNC_SEPOLIA_CHAIN_ID) {
            const _ = await hre.run(TASK_VERIFY, { address: await upgradedFactory.getAddress() });
        }
    });
});
