import { TASK_VERIFY } from '@matterlabs/hardhat-zksync-verify/dist/src/constants';
import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import { Contract } from 'zksync-ethers';

export async function deployContractAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const contract = await runSuper(taskArgs);
    if (taskArgs.verify) {
        const artifact = await hre.deployer.loadArtifact(taskArgs.contractName);
        await hre.run(TASK_VERIFY, {
            contract: `${artifact.sourceName}:${artifact.contractName}`,
            address: contract.address,
            constructorArgsParams: taskArgs.constructorArgsParams,
            constructorArgs: taskArgs.constructorArgs,
            noCompile: taskArgs.noCompile,
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
            address: proxy.address,
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
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: proxy.address,
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
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: proxy.address,
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
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<Contract> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run(TASK_VERIFY, {
            address: proxy.address,
        });
    }

    return proxy;
}
