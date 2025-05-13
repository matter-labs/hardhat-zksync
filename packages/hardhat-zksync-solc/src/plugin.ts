import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import fs from 'fs';
import lodash from 'lodash';
import semver from 'semver';
import {
    TASK_DOWNLOAD_ZKSOLC,
    TASK_UPDATE_SOLIDITY_COMPILERS,
    ZKSOLC_COMPILER_VERSION_WITH_LIBRARY_LINKING,
} from './constants';
import { ZkSyncSolcPluginError } from './errors';
import { generateFQN, getLibraryLink } from './utils';
import { link } from './compile';

export async function compileLink(
    taskArgs: {
        sourceName: string;
        contractName: string;
        libraries?: { [libraryName: string]: string };
        withoutError?: boolean;
    },
    hre: HardhatRuntimeEnvironment,
): Promise<string | undefined> {
    if (!hre.network.zksync) {
        throw new ZkSyncSolcPluginError('This task is only available for zkSync network');
    }

    await hre.run(TASK_DOWNLOAD_ZKSOLC);
    await hre.run(TASK_UPDATE_SOLIDITY_COMPILERS);

    if (semver.lt(hre.config.zksolc.version, ZKSOLC_COMPILER_VERSION_WITH_LIBRARY_LINKING)) {
        return undefined;
    }

    const contractFQN = generateFQN(taskArgs.sourceName, taskArgs.contractName);
    const contractFilePath = path.join(
        hre.config.paths.artifacts,
        taskArgs.sourceName,
        `${taskArgs.contractName}.zbin`,
    );
    const artifact = await hre.artifacts.readArtifact(contractFQN);

    fs.writeFileSync(contractFilePath, artifact.bytecode);
    const output = await link(hre.config.zksolc, await getLibraryLink(hre, taskArgs.libraries, contractFilePath));

    if (!lodash.isEmpty(output.unlinked)) {
        if (taskArgs.withoutError) {
            return undefined;
        }

        throw new ZkSyncSolcPluginError(
            `Libraries for contract ${contractFQN} are not linked: ${Object.values(output.unlinked[contractFilePath])
                .map((lib) => `${lib}`)
                .join(', ')}`,
        );
    }

    if (!lodash.isEmpty(output.ignored)) {
        console.warn(
            `Linking of some libraries for contract ${contractFQN} are ignored as they are provided as the duplicate of the already linked libraries.`,
        );
    }

    const newBytecode = fs.readFileSync(contractFilePath, { encoding: 'utf-8' });

    return newBytecode;
}
