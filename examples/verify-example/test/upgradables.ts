import chalk from 'chalk';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

import * as hre from 'hardhat';
import { Contract } from 'ethers';
import * as zk from 'zksync-ethers';
import { PRIVATE_KEY, TASK_VERIFY, useEnvironment } from './helpers';

describe('verify upgradable smart contracts', async function () {
    useEnvironment();

    it('Deploy and verify box beacon', async function () {
        const contractName = 'Box';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        const boxContract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, boxContract);
        await beacon.deployed();

        const box = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon.address, boxContract, [42]);
        await box.deployed();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const _ = await hre.run(TASK_VERIFY, { address: box.address });
    });

    it('Deploy and verify box proxy', async function () {
        const contractName = 'Box';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

        await box.deployed();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const _ = await hre.run(TASK_VERIFY, { address: box.address });
    });

    it('Deploy and verify box uups', async function () {
        const contractName = 'BoxUups';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

        await box.deployed();

        box.connect(zkWallet);
        const value = await box.retrieve();
        console.info(chalk.cyan('Box value is: ', value));

        const _ = await hre.run(TASK_VERIFY, { address: box.address });
    });

    it('Deploy, upgrade and verify box becaon', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        // deploy beacon proxy

        const contractName = 'Box';
        const contract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
        await beacon.deployed();

        const beaconAddress = beacon.address;

        const boxBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beaconAddress, contract, [42]);
        await boxBeaconProxy.deployed();

        // upgrade beacon

        const boxV2Implementation = await deployer.loadArtifact('BoxV2');
        await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beaconAddress, boxV2Implementation);
        console.info(chalk.green('Successfully upgraded beacon Box to BoxV2 on address: ', beaconAddress));

        const attachTo = new zk.ContractFactory(
            boxV2Implementation.abi,
            boxV2Implementation.bytecode,
            deployer.zkWallet,
            deployer.deploymentType,
        );
        const upgradedBox = attachTo.attach(boxBeaconProxy.address);

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('New box value is', value));

        const _ = await hre.run(TASK_VERIFY, { address: upgradedBox.address });
    });

    it('Deploy, upgrade and verify box uups', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        // deploy proxy
        const contractName = 'BoxUups';

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'initialize' });

        await box.deployed();

        // upgrade proxy implementation

        const BoxUupsV2 = await deployer.loadArtifact('BoxUupsV2');
        const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, box.address, BoxUupsV2);
        console.info(chalk.green('Successfully upgraded BoxUups to BoxUupsV2'));

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('BoxUups value is', value));

        const _ = await hre.run(TASK_VERIFY, { address: upgradedBox.address });
    });

    it('Deploy, upgrade and verify box', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);
        // deploy proxy
        const contractName = 'Box';

        const contract = await deployer.loadArtifact(contractName);
        const box = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [42], { initializer: 'store' });

        await box.deployed();

        // upgrade proxy implementation

        const BoxV2 = await deployer.loadArtifact('BoxV2');
        const upgradedBox = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, box.address, BoxV2);
        console.info(chalk.green('Successfully upgraded Box to BoxV2'));

        upgradedBox.connect(zkWallet);
        // wait some time before the next call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const value = await upgradedBox.retrieve();
        console.info(chalk.cyan('Box value is', value));

        const _ = await hre.run(TASK_VERIFY, { address: upgradedBox.address });
    });

    it('Deploy factory beacon', async function () {
        const contractName = 'Factory';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        const factoryContract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, factoryContract);
        await beacon.deployed();

        const factory = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, factoryContract, []);
        await factory.deployed();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const _ = await hre.run(TASK_VERIFY, { address: factory.address });
    });

    it('Deploy factory proxy', async function () {
        const contractName = 'Factory';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });
        await factory.deployed();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const _ = await hre.run(TASK_VERIFY, { address: factory.address });
    });

    it('Deploy factory uups', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        const contractName = 'Factory';
        const contract = await deployer.loadArtifact(contractName);
        const beacon = await hre.zkUpgrades.deployBeacon(deployer.zkWallet, contract);
        await beacon.deployed();

        const factoryBeaconProxy = await hre.zkUpgrades.deployBeaconProxy(deployer.zkWallet, beacon, contract, []);
        await factoryBeaconProxy.deployed();

        // upgrade beacon

        const factoryV2Implementation = await deployer.loadArtifact('FactoryV2');
        await hre.zkUpgrades.upgradeBeacon(deployer.zkWallet, beacon.address, factoryV2Implementation);
        console.info(chalk.green('Successfully upgraded beacon Factory to FactoryV2 on address: ', beacon.address));

        const attachTo = new zk.ContractFactory(
            factoryV2Implementation.abi,
            factoryV2Implementation.bytecode,
            deployer.zkWallet,
            deployer.deploymentType,
        );
        const upgradedFactory = attachTo.attach(factoryBeaconProxy.address) as Contract;
        upgradedFactory.connect(zkWallet);
        const number = await upgradedFactory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const _ = await hre.run(TASK_VERIFY, { address: upgradedFactory.address });
    });

    it('Deploy factory, upgrade and verify beacon', async function () {
        const contractName = 'FactoryUups';
        console.info(chalk.yellow(`Deploying ${contractName}...`));

        const zkWallet = new zk.Wallet(PRIVATE_KEY);

        const deployer = new Deployer(hre, zkWallet);

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.deployed();

        factory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }

        const _ = await hre.run(TASK_VERIFY, { address: factory.address });
    });

    it('Deploy factory, upgrade and verify uups', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        // deploy proxy
        const contractName = 'FactoryUups';

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.deployed();

        // upgrade proxy implementation

        const FactoryUupsV2 = await deployer.loadArtifact('FactoryUupsV2');
        const upgradedFactory = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, factory.address, FactoryUupsV2);
        console.info(chalk.green('Successfully upgraded FactoryUups to FactoryUupsV2'));

        const _ = await hre.run(TASK_VERIFY, { address: upgradedFactory.address });
    });

    it('Deploy factory, upgrade and verify', async function () {
        const zkWallet = new zk.Wallet(PRIVATE_KEY);
        const deployer = new Deployer(hre, zkWallet);

        const contractName = 'Factory';

        const contract = await deployer.loadArtifact(contractName);
        const factory = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [], {
            initializer: 'initialize',
        });

        await factory.deployed();

        const FactoryV2 = await deployer.loadArtifact('FactoryV2');
        const upgradedFactory = await hre.zkUpgrades.upgradeProxy(deployer.zkWallet, factory.address, FactoryV2);
        console.info(chalk.green('Successfully upgraded Factory to FactoryV2'));

        upgradedFactory.connect(zkWallet);
        const number = await factory.getNumberOfDeployedContracts();
        if (number === 0) {
            throw new Error(
                'Something went wrong during deployment of a Factory contract. Initialize functions is probably not called.',
            );
        }
        const _ = await hre.run(TASK_VERIFY, { address: upgradedFactory.address });
    });
});
