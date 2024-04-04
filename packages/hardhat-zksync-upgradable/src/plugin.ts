import { Deployer } from '@matterlabs/hardhat-zksync-deploy/dist/deployer';
import { getConstructorArguments } from '@matterlabs/hardhat-zksync-deploy/dist/utils';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { DeploymentType } from 'zksync-ethers/build/src/types';
import { getWallet } from './utils';

export async function deployBeacon(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        initializer?: string;
        deploymentType?: DeploymentType;
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
    const beacon = await hre.zkUpgrades.deployBeacon(
        wallet,
        contract,
        taskArgs.deploymentType ? { deploymentType: taskArgs.deploymentType } : undefined,
    );
    await beacon.waitForDeployment();

    const proxy = await hre.zkUpgrades.deployBeaconProxy(
        deployer.zkWallet,
        await beacon.getAddress(),
        contract,
        constructorArguments,
        taskArgs.initializer
            ? {
                  initializer: taskArgs.initializer,
              }
            : undefined,
    );
    await proxy.waitForDeployment();

    return {
        proxy,
        beacon,
    };
}

export async function deployProxy(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        initializer?: string;
        deploymentType?: DeploymentType;
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

    const opts = {
        deploymentType: taskArgs.deploymentType,
        initializer: taskArgs.initializer,
    };

    const proxy = await hre.zkUpgrades.deployProxy(wallet, contract, constructorArguments, opts);

    await proxy.waitForDeployment();

    return proxy;
}

export async function upgradeBeacon(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        beaconAddress: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);

    const opts = {
        deploymentType: taskArgs.deploymentType,
    };

    const beaconUpgrade = await hre.zkUpgrades.upgradeBeacon(wallet, taskArgs.beaconAddress, contractV2, opts);
    await beaconUpgrade.waitForDeployment();

    return beaconUpgrade;
}

export async function upgradeProxy(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        proxyAddress: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);

    const opts = {
        deploymentType: taskArgs.deploymentType,
    };

    const proxyUpgrade = await hre.zkUpgrades.upgradeProxy(wallet, taskArgs.proxyAddress, contractV2, opts);

    await proxyUpgrade.waitForDeployment();

    return proxyUpgrade;
}
