import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { getConstructorArguments } from '@matterlabs/hardhat-zksync-deploy/src/utils';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { getWallet } from './utils';

export async function deployBeaconWithOneLine(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
    },
): Promise<{
    proxy: Contract;
    beacon: Contract;
}> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const constructorArguments: any[] = await getConstructorArguments(
        taskArgs.constructorArgsParams,
        taskArgs.constructorArgs,
    );

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contract = await deployer.loadArtifact(taskArgs.contractName);
    const beacon = await hre.zkUpgrades.deployBeacon(wallet, contract);
    await beacon.waitForDeployment();

    const proxy = await hre.zkUpgrades.deployBeaconProxy(
        deployer.zkWallet,
        await beacon.getAddress(),
        contract,
        constructorArguments,
    );
    await proxy.waitForDeployment();

    return {
        proxy,
        beacon,
    };
}

export async function deployProxyWithOneLine(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const constructorArguments: any[] = await getConstructorArguments(
        taskArgs.constructorArgsParams,
        taskArgs.constructorArgs,
    );

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contract = await deployer.loadArtifact(taskArgs.contractName);
    const proxy = await hre.zkUpgrades.deployProxy(wallet, contract, constructorArguments);
    await proxy.waitForDeployment();

    return proxy;
}

export async function upgradeBeaconWithOneLine(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        beaconAddress: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);
    const beaconUpgrade = await hre.zkUpgrades.upgradeBeacon(wallet, taskArgs.beaconAddress, contractV2);
    await beaconUpgrade.waitForDeployment();

    return beaconUpgrade;
}

export async function upgradeProxyWithOneLine(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        proxyAddress: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);
    const proxyUpgrade = await hre.zkUpgrades.upgradeProxy(wallet, taskArgs.proxyAddress, contractV2);
    await proxyUpgrade.waitForDeployment();

    return proxyUpgrade;
}
