import { TASK_FLATTEN_GET_FLATTENED_SOURCE } from 'hardhat/builtin-tasks/task-names';
import { Artifacts, HardhatRuntimeEnvironment, ResolvedFile } from 'hardhat/types';
import { isFullyQualifiedName, parseFullyQualifiedName } from 'hardhat/utils/contract-names';
import { MULTIPLE_MATCHING_CONTRACTS, CONTRACT_NAME_NOT_FOUND, NO_MATCHING_CONTRACT } from './constants';
import { Bytecode, extractMatchingContractInformation } from './solc/bytecode';
import { ZkSyncVerifyPluginError } from './errors';

export async function inferContractArtifacts(
    artifacts: Artifacts,
    matchingCompilerVersions: string[],
    deployedBytecode: Bytecode
): Promise<any> {
    const contractMatches = [];
    const fqNames = await artifacts.getAllFullyQualifiedNames();

    for (const fqName of fqNames) {
        const buildInfo = await artifacts.getBuildInfo(fqName);

        if (buildInfo === undefined) {
            continue;
        }

        if (!matchingCompilerVersions.includes(buildInfo.solcVersion)) {
            continue;
        }

        const { sourceName, contractName } = parseFullyQualifiedName(fqName);

        const contractInformation = await extractMatchingContractInformation(
            sourceName,
            contractName,
            buildInfo,
            deployedBytecode
        );
        if (contractInformation !== null) {
            contractMatches.push(contractInformation);
            break;
        }
    }

    if (contractMatches.length === 0) throw new ZkSyncVerifyPluginError(NO_MATCHING_CONTRACT);

    if (contractMatches.length > 1) throw new ZkSyncVerifyPluginError(MULTIPLE_MATCHING_CONTRACTS);

    return contractMatches[0];
}

export async function flattenContractFile(hre: HardhatRuntimeEnvironment, filePath: string): Promise<string> {
    return await hre.run(TASK_FLATTEN_GET_FLATTENED_SOURCE, {
        files: [filePath],
    });
}

export async function checkContractName(artifacts: Artifacts, contractFQN: string) {
    if (contractFQN !== undefined) {
        if (!isFullyQualifiedName(contractFQN)) {
            throw new ZkSyncVerifyPluginError(
                `A valid fully qualified name was expected. Fully qualified names look like this: "contracts/AContract.sol:TheContract"
Instead, this name was received: ${contractFQN}`
            );
        }

        if (!(await artifacts.artifactExists(contractFQN))) {
            throw new ZkSyncVerifyPluginError(`The contract ${contractFQN} is not present in your project.`);
        }
    } else {
        throw new ZkSyncVerifyPluginError(CONTRACT_NAME_NOT_FOUND);
    }
}

export function getSolidityStandardJsonInput(hre: HardhatRuntimeEnvironment, resolvedFiles: ResolvedFile[]): any {
    return {
        language: 'Solidity',
        sources: Object.fromEntries(
            resolvedFiles.map((file) => [file.sourceName, { content: file.content.rawContent }])
        ),
        settings: hre.config.zksolc.settings,
    };
}
