import { HardhatRuntimeEnvironment, HttpNetworkConfig, Network, NetworksConfig } from 'hardhat/types';
import * as zk from 'zksync-web3';
import * as ethers from 'ethers';

import { ZkSyncArtifact } from './types';
import { ZkSyncDeployPluginError } from './errors';
import { ETH_DEFAULT_NETWORK_RPC_URL } from './constants';
import { isHttpNetworkConfig } from './utils';

const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';
const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli'];

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
    public hre: HardhatRuntimeEnvironment;
    public ethWallet: ethers.Wallet;
    public zkWallet: zk.Wallet;
    public deploymentType?: zk.types.DeploymentType;

    constructor(hre: HardhatRuntimeEnvironment, zkWallet: zk.Wallet, deploymentType?: zk.types.DeploymentType) {
        this.hre = hre;
        this.deploymentType = deploymentType;

        // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2).
        const { ethWeb3Provider, zkWeb3Provider } = this._createProviders(hre.config.networks, hre.network);

        this.zkWallet = zkWallet.connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
        this.ethWallet = this.zkWallet.ethWallet();
    }

    static fromEthWallet(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet, deploymentType?: zk.types.DeploymentType) {
        return new Deployer(hre, new zk.Wallet(ethWallet.privateKey), deploymentType);
    }

    private _createProviders(
        networks: NetworksConfig,
        network: Network
    ): {
        ethWeb3Provider: ethers.providers.BaseProvider;
        zkWeb3Provider: zk.Provider;
    } {
        const networkName = network.name;

        if (!network.zksync) {
            throw new ZkSyncDeployPluginError(
                `Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.`
            );
        }

        if (networkName === 'hardhat') {
            return {
                ethWeb3Provider: this._createDefaultEthProvider(),
                zkWeb3Provider: this._createDefaultZkProvider(),
            };
        }

        const networkConfig = network.config;

        if (!isHttpNetworkConfig(networkConfig)) {
            throw new ZkSyncDeployPluginError(
                `Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'url' specified.`
            );
        }

        if (networkConfig.ethNetwork === undefined) {
            throw new ZkSyncDeployPluginError(
                `Only deploying to zkSync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'ethNetwork' (layer 1) specified.`
            );
        }

        let ethWeb3Provider, zkWeb3Provider;
        const ethNetwork = networkConfig.ethNetwork;

        if (SUPPORTED_L1_TESTNETS.includes(ethNetwork)) {
            ethWeb3Provider =
                ethNetwork in networks && isHttpNetworkConfig(networks[ethNetwork])
                    ? new ethers.providers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                    : ethers.getDefaultProvider(ethNetwork);
        } else {
            ethWeb3Provider =
                ethNetwork === 'localhost'
                    ? this._createDefaultEthProvider()
                    : new ethers.providers.JsonRpcProvider(ethNetwork);
        }

        zkWeb3Provider = new zk.Provider((network.config as HttpNetworkConfig).url);

        return { ethWeb3Provider, zkWeb3Provider };
    }

    private _createDefaultEthProvider(): ethers.providers.BaseProvider {
        return new ethers.providers.JsonRpcProvider(ETH_DEFAULT_NETWORK_RPC_URL);
    }

    private _createDefaultZkProvider(): zk.Provider {
        return zk.Provider.getDefaultProvider();
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
    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        const artifact = await this.hre.artifacts.readArtifact(contractNameOrFullyQualifiedName);

        // Verify that this artifact was compiled by the zkSync compiler, and not `solc` or `vyper`.
        if (
            artifact._format !== ZKSOLC_ARTIFACT_FORMAT_VERSION &&
            artifact._format !== ZKVYPER_ARTIFACT_FORMAT_VERSION
        ) {
            throw new ZkSyncDeployPluginError(
                `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`
            );
        }
        return artifact as ZkSyncArtifact;
    }

    /**
     * Estimates the price of calling a deploy transaction in ETH.
     *
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     *
     * @returns Calculated fee in ETH wei
     */
    public async estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<ethers.BigNumber> {
        const gas = await this.estimateDeployGas(artifact, constructorArguments);
        const gasPrice = await this.zkWallet.provider.getGasPrice();
        return gas.mul(gasPrice);
    }

    /**
     * Estimates the amount of gas needed to execute a deploy transaction.
     *
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     *
     * @returns Calculated amount of gas.
     */
    public async estimateDeployGas(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<ethers.BigNumber> {
        const factoryDeps = await this.extractFactoryDeps(artifact);
        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet, this.deploymentType);

        // Encode deploy transaction so it can be estimated.
        const deployTx = factory.getDeployTransaction(...constructorArguments, {
            customData: {
                factoryDeps,
            },
        });
        deployTx.from = this.zkWallet.address;

        return await this.zkWallet.provider.estimateGas(deployTx);
    }

    /**
     * Sends a deploy transaction to the zkSync network.
     * For now, it will use defaults for the transaction parameters:
     * - fee amount is requested automatically from the zkSync server.
     *
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     * @param overrides Optional object with additional deploy transaction parameters.
     * @param additionalFactoryDeps Additional contract bytecodes to be added to the factory dependencies list.
     *
     * @returns A contract object.
     */
    public async deploy(
        artifact: ZkSyncArtifact,
        constructorArguments: any[] = [],
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[]
    ): Promise<zk.Contract> {
        const baseDeps = await this.extractFactoryDeps(artifact);
        const additionalDeps = additionalFactoryDeps
            ? additionalFactoryDeps.map((val) => ethers.utils.hexlify(val))
            : [];
        const factoryDeps = [...baseDeps, ...additionalDeps];

        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet, this.deploymentType);
        const { customData, ..._overrides } = overrides ?? {};

        // Encode and send the deploy transaction providing factory dependencies.
        const contract = await factory.deploy(...constructorArguments, {
            ..._overrides,
            customData: {
                ...customData,
                factoryDeps,
            },
        });
        await contract.deployed();

        return contract;
    }

    /**
     * Extracts factory dependencies from the artifact.
     *
     * @param artifact Artifact to extract dependencies from
     *
     * @returns Factory dependencies in the format expected by SDK.
     */
    async extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]> {
        const visited = new Set<string>();
        visited.add(`${artifact.sourceName}:${artifact.contractName}`);
        return await this.extractFactoryDepsRecursive(artifact, visited);
    }

    private async extractFactoryDepsRecursive(artifact: ZkSyncArtifact, visited: Set<string>): Promise<string[]> {
        // Load all the dependency bytecodes.
        // We transform it into an array of bytecodes.
        const factoryDeps: string[] = [];
        for (const dependencyHash in artifact.factoryDeps) {
            const dependencyContract = artifact.factoryDeps[dependencyHash];
            const dependencyArtifact = await this.loadArtifact(dependencyContract);
            factoryDeps.push(dependencyArtifact.bytecode);
            if (!visited.has(dependencyContract)) {
                visited.add(dependencyContract);
                const transitiveDeps = await this.extractFactoryDepsRecursive(dependencyArtifact, visited);
                factoryDeps.push(...transitiveDeps);
            }
        }

        return factoryDeps;
    }
}
