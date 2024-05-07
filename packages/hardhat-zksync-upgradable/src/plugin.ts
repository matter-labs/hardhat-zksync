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
        deploymentTypeImpl?: DeploymentType;
        deploymentTypeProxy?: DeploymentType;
        saltImpl?: string;
        saltProxy?: string;
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
    const beacon = await hre.zkUpgrades.deployBeacon(wallet, contract, {
        deploymentType: taskArgs.deploymentTypeImpl,
        salt: taskArgs.saltImpl,
    });
    await beacon.waitForDeployment();

    const proxy = await hre.zkUpgrades.deployBeaconProxy(
        deployer.zkWallet,
        await beacon.getAddress(),
        contract,
        constructorArguments,
        {
            deploymentType: taskArgs.deploymentTypeProxy,
            salt: taskArgs.saltProxy,
            initializer: taskArgs.initializer,
        },
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
        deploymentTypeImpl?: DeploymentType;
        deploymentTypeProxy?: DeploymentType;
        saltImpl?: string;
        saltProxy?: string;
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

    const proxy = await hre.zkUpgrades.deployProxy(wallet, contract, constructorArguments, {
        deploymentTypeImpl: taskArgs.deploymentTypeImpl,
        saltImpl: taskArgs.saltImpl,
        deploymentTypeProxy: taskArgs.deploymentTypeProxy,
        saltProxy: taskArgs.saltProxy,
        initializer: taskArgs.initializer,
    });

    await proxy.waitForDeployment();

    return proxy;
}

export async function upgradeBeacon(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        beaconAddress: string;
        deploymentType?: DeploymentType;
        salt?: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);

    const beaconUpgrade = await hre.zkUpgrades.upgradeBeacon(wallet, taskArgs.beaconAddress, contractV2, {
        deploymentType: taskArgs.deploymentType,
        salt: taskArgs.salt,
    });

    await beaconUpgrade.waitForDeployment();

    return beaconUpgrade;
}

export async function upgradeProxy(
    hre: HardhatRuntimeEnvironment,
    taskArgs: {
        contractName: string;
        proxyAddress: string;
        deploymentType?: DeploymentType;
        salt?: string;
        noCompile?: boolean;
    },
): Promise<Contract> {
    if (!taskArgs.noCompile) {
        await hre.run(TASK_COMPILE);
    }

    const wallet = await getWallet(hre);
    const deployer = new Deployer(hre, wallet);

    const contractV2 = await deployer.loadArtifact(taskArgs.contractName);

    const proxyUpgrade = await hre.zkUpgrades.upgradeProxy(wallet, taskArgs.proxyAddress, contractV2, {
        deploymentType: taskArgs.deploymentType,
        salt: taskArgs.salt,
    });

    await proxyUpgrade.waitForDeployment();

    return proxyUpgrade;
}
