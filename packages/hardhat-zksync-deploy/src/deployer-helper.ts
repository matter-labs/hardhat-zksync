import { HardhatRuntimeEnvironment, HttpNetworkConfig, Network, NetworksConfig } from 'hardhat/types';
import { DeploymentType } from 'zksync-ethers/build/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import { ZkSyncArtifact } from './types';
import { ZkSyncDeployPluginError } from './errors';
import { isHttpNetworkConfig, isValidEthNetworkURL } from './utils';
import { loadCache, saveCache } from './deployment-saver';
import { ETH_DEFAULT_NETWORK_RPC_URL } from './constants';

const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';

const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'sepolia'];

export interface Providers {
    ethWeb3Provider: ethers.Provider;
    zkWeb3Provider: zk.Provider;
}

/**
 * Loads an artifact and verifies that it was compiled by `zksolc`.
 *
 * @param contractNameOrFullyQualifiedName The name of the contract.
 *   It can be a contract bare contract name (e.g. "Token") if it's
 *   unique in your project, or a fully qualified contract name
 *   (e.g. "contract/token.sol:Token") otherwise.
 *
 * @throws Throws an error if a non-unique contract name is used,
 *   indicating which fully qualified names can be used instead.
 *
 * @throws Throws an error if an artifact was not compiled by `zksolc`.
 */
export async function loadArtifact(
    hre: HardhatRuntimeEnvironment,
    contractNameOrFullyQualifiedName: string,
): Promise<ZkSyncArtifact> {
    const artifact = await hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);

    // Verify that this artifact was compiled by the ZKsync compiler, and not `solc` or `vyper`.
    if (artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION && artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION) {
        throw new ZkSyncDeployPluginError(
            `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`,
        );
    }
    return artifact as ZkSyncArtifact;
}

/**
 * Sends a deploy transaction to the ZKsync network.
 * For now, it will use defaults for the transaction parameters:
 * - fee amount is requested automatically from the ZKsync server.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 * @param overrides Optional object with additional deploy transaction parameters.
 * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
 *
 * @returns A contract object.
 */
export async function deploy(
    hre: HardhatRuntimeEnvironment,
    contractNameOrArtifact: ZkSyncArtifact | string,
    constructorArguments: any[] = [],
    zkWallet: zk.Wallet,
    deploymentType: DeploymentType = 'create',
    overrides?: ethers.Overrides,
    additionalFactoryDeps?: ethers.BytesLike[],
): Promise<zk.Contract> {
    const artifact: ZkSyncArtifact =
        typeof contractNameOrArtifact === 'string'
            ? await loadArtifact(hre, contractNameOrArtifact)
            : contractNameOrArtifact;

    const baseDeps = await _extractFactoryDeps(hre, artifact);
    const additionalDeps = additionalFactoryDeps ? additionalFactoryDeps.map((val) => ethers.hexlify(val)) : [];
    const factoryDeps = [...baseDeps, ...additionalDeps];

    const deploymentEntry = await loadCache(
        hre,
        artifact,
        deploymentType,
        constructorArguments,
        overrides?.customData?.salt ?? ethers.ZeroHash,
        factoryDeps,
    );

    if (!hre.network.forceDeploy && deploymentEntry) {
        return new zk.Contract(deploymentEntry.address, artifact.abi, zkWallet);
    }

    const factory = new zk.ContractFactory<any[], zk.Contract>(
        artifact.abi,
        artifact.bytecode,
        zkWallet,
        deploymentType,
    );
    const { customData, ..._overrides } = overrides ?? {};

    // Encode and send the deploy transaction providing factory dependencies.
    const contract = await factory.deploy(...constructorArguments, {
        ..._overrides,
        customData: {
            ...customData,
            factoryDeps,
        },
    });
    await contract.waitForDeployment();

    await saveCache(hre, artifact, {
        constructorArgs: constructorArguments,
        salt: overrides?.customData?.salt ?? ethers.ZeroHash,
        deploymentType,
        factoryDeps,
        address: await contract.getAddress(),
        txHash: contract.deploymentTransaction()!.hash,
    });

    return contract;
}

/**
 * Estimates the price of calling a deploy transaction in ETH.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated fee in ETH wei
 */
export async function estimateDeployFee(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    constructorArguments: any[],
    zkWallet: zk.Wallet,
): Promise<bigint> {
    const gas = await estimateDeployGas(hre, artifact, constructorArguments, zkWallet);
    const gasPrice = await zkWallet.provider.getGasPrice();
    return gas * gasPrice;
}

/**
 * Estimates the amount of gas needed to execute a deploy transaction.
 *
 * @param artifact The previously loaded artifact object.
 * @param constructorArguments List of arguments to be passed to the contract constructor.
 *
 * @returns Calculated amount of gas.
 */
export async function estimateDeployGas(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    constructorArguments: any[],
    zkWallet: zk.Wallet,
    deploymentType: DeploymentType = 'create',
): Promise<bigint> {
    const factoryDeps = await _extractFactoryDeps(hre, artifact);
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, zkWallet, deploymentType);

    // Encode deploy transaction so it can be estimated.
    const deployTx = await factory.getDeployTransaction(...constructorArguments, {
        customData: {
            factoryDeps,
        },
    });
    deployTx.from = zkWallet.address;

    return await zkWallet.provider.estimateGas(deployTx);
}

/**
 * Extracts factory dependencies from the artifact.
 *
 * @param artifact Artifact to extract dependencies from
 *
 * @returns Factory dependencies in the format expected by SDK.
 */
export async function _extractFactoryDeps(hre: HardhatRuntimeEnvironment, artifact: ZkSyncArtifact): Promise<string[]> {
    const visited = new Set<string>();
    visited.add(`${artifact.sourceName}:${artifact.contractName}`);
    return await _extractFactoryDepsRecursive(hre, artifact, visited);
}

export async function _extractFactoryDepsRecursive(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    visited: Set<string>,
): Promise<string[]> {
    // Load all the dependency bytecodes.
    // We transform it into an array of bytecodes.
    const factoryDeps: string[] = [];
    for (const dependencyHash in artifact.factoryDeps) {
        if (!dependencyHash) continue;
        const dependencyContract = artifact.factoryDeps[dependencyHash];
        if (!visited.has(dependencyContract)) {
            const dependencyArtifact = await loadArtifact(hre, dependencyContract);
            factoryDeps.push(dependencyArtifact.bytecode);
            visited.add(dependencyContract);
            const transitiveDeps = await _extractFactoryDepsRecursive(hre, dependencyArtifact, visited);
            factoryDeps.push(...transitiveDeps);
        }
    }

    return factoryDeps;
}

export function createProviders(
    networks: NetworksConfig,
    network: Network,
): {
    ethWeb3Provider: ethers.Provider;
    zkWeb3Provider: zk.Provider;
} {
    const networkName = network.name;

    if (!network.zksync) {
        throw new ZkSyncDeployPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.`,
        );
    }

    if (networkName === 'hardhat') {
        return {
            ethWeb3Provider: _createDefaultEthProvider(),
            zkWeb3Provider: _createDefaultZkProvider(),
        };
    }

    const networkConfig = network.config;

    if (!isHttpNetworkConfig(networkConfig)) {
        throw new ZkSyncDeployPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'url' specified.`,
        );
    }

    if (networkConfig.ethNetwork === undefined) {
        throw new ZkSyncDeployPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'ethNetwork' (layer 1) specified.`,
        );
    }

    let ethWeb3Provider;
    const ethNetwork = networkConfig.ethNetwork;

    if (SUPPORTED_L1_TESTNETS.includes(ethNetwork)) {
        ethWeb3Provider =
            ethNetwork in networks && isHttpNetworkConfig(networks[ethNetwork])
                ? new ethers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                : ethers.getDefaultProvider(ethNetwork);
    } else {
        if (ethNetwork === 'localhost' || ethNetwork === '') {
            ethWeb3Provider = _createDefaultEthProvider();
        } else if (isValidEthNetworkURL(ethNetwork)) {
            ethWeb3Provider = new ethers.JsonRpcProvider(ethNetwork);
        } else {
            ethWeb3Provider =
                ethNetwork in networks && isHttpNetworkConfig(networks[ethNetwork])
                    ? new ethers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                    : ethers.getDefaultProvider(ethNetwork);
        }
    }

    const zkWeb3Provider = new zk.Provider((network.config as HttpNetworkConfig).url);

    return { ethWeb3Provider, zkWeb3Provider };
}

function _createDefaultEthProvider(): ethers.Provider {
    return new ethers.JsonRpcProvider(ETH_DEFAULT_NETWORK_RPC_URL);
}

function _createDefaultZkProvider(): zk.Provider {
    return zk.Provider.getDefaultProvider()!;
}
