import { TASK_VERIFY } from '@matterlabs/hardhat-zksync-verify/dist/src/constants';
import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';
import { DeploymentType } from 'zksync-ethers/build/types';

export async function deployContractAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        deploymentType?: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const contract = await runSuper(taskArgs);
    if (taskArgs.verify) {
        const artifact = await hre.deployer.loadArtifact(taskArgs.contractName);
        await hre.run(TASK_VERIFY, {
            contract: `${artifact.sourceName}:${artifact.contractName}`,
            address: await contract.getAddress(),
            constructorArgsParams: taskArgs.constructorArgsParams,
            constructorArgs: taskArgs.constructorArgs,
            noCompile: true,
        });
    }

    return contract;
}

export async function deployBeaconAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        initializer?: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<{
    proxy: Contract;
    beacon: Contract;
}> {
    const { proxy, beacon } = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: await proxy.getAddress(),
            noCompile: true,
        });
    }

    return { proxy, beacon };
}

export async function deployProxyAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        initializer?: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: await proxy.getAddress(),
            noCompile: true,
        });
    }

    return proxy;
}

export async function upgradeBeaconAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        beaconAddress: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: await proxy.getAddress(),
            noCompile: true,
        });
    }

    return proxy;
}

export async function upgradeProxyAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        proxyAddress: string;
        deploymentType?: DeploymentType;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: await proxy.getAddress(),
            noCompile: true,
        });
    }

    return proxy;
}
