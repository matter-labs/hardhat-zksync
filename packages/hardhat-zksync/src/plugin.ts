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
