import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';

export async function deployWithOneLineAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<void> {
    const contract = await runSuper(taskArgs);
    if (taskArgs.verify) {
        const artifact = await hre.deployer.loadArtifact(taskArgs.contractName);
        await hre.run('verify', {
            contract: `${artifact.sourceName}:${artifact.contractName}`,
            address: await contract.getAddress(),
            constructorArgsParams: taskArgs.constructorArgsParams,
            constructorArgs: taskArgs.constructorArgs,
            noCompile: taskArgs.noCompile,
        });
    }
}

export async function deployBeaconWithOneLineAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<void> {
    const { proxy, _ } = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run('verify:verify', {
            address: await proxy.getAddress(),
        });
    }
}

export async function deployProxyWithOneLineAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        constructorArgsParams: any[];
        constructorArgs?: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<void> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run('verify:verify', {
            address: await proxy.getAddress(),
        });
    }
}

export async function upgradeBeaconWithOneLineAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        beaconAddress: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<void> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run('verify:verify', {
            address: await proxy.getAddress(),
        });
    }
}

export async function upgradeProxyWithOneLineAndVerify(
    hre: HardhatRuntimeEnvironment,
    runSuper: RunSuperFunction<TaskArguments>,
    taskArgs: {
        contractName: string;
        proxyAddress: string;
        noCompile?: boolean;
        verify?: boolean;
    },
): Promise<void> {
    const proxy = await runSuper(taskArgs);
    if (taskArgs.verify) {
        await hre.run('verify:verify', {
            address: await proxy.getAddress(),
        });
    }
}
