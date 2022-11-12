import { HardhatRuntimeEnvironment, HttpNetworkConfig, NetworksConfig } from 'hardhat/types';
import * as zk from 'zksync-web3';
import * as ethers from 'ethers';

import { ZkSyncArtifact } from './types';
import { ZkSyncDeployPluginError } from './zksync-deploy-plugin-error';
import { ETH_DEFAULT_NETWORK, ETH_DEFAULT_NETWORK_RPC_URL } from './constants';

const ZKSOLC_ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const ZKVYPER_ARTIFACT_FORMAT_VERSION = 'hh-zkvyper-artifact-1';
const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli', 'localhost'];

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
    public hre: HardhatRuntimeEnvironment;
    public ethWallet: ethers.Wallet;
    public zkWallet: zk.Wallet;

    constructor(hre: HardhatRuntimeEnvironment, zkWallet: zk.Wallet) {
        this.hre = hre;

        // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2).
        const { ethWeb3Provider, zkWeb3Provider } = this._createProviders(hre.config.networks, hre.zksyncNetwork);

        this.zkWallet = zkWallet.connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
        this.ethWallet = this.zkWallet.ethWallet();
    }

    static fromEthWallet(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet) {
        return new Deployer(hre, new zk.Wallet(ethWallet.privateKey));
    }

    private _createProviders(
        networks: NetworksConfig,
        zksyncNetwork?: string
    ): {
        ethWeb3Provider: ethers.providers.BaseProvider;
        zkWeb3Provider: zk.Provider;
    } {
        if (zksyncNetwork === undefined) {
            return {
                ethWeb3Provider: this._createDefaultEthProvider(networks),
                zkWeb3Provider: this._createDefaultZkProvider(),
            };
        }

        let ethWeb3Provider, zkWeb3Provider;

        if (!(zksyncNetwork in networks) || networks[zksyncNetwork].zksync !== true) {
            throw new ZkSyncDeployPluginError(
                `ZkSync network '${zksyncNetwork}' is not configured in 'hardhat.config' file, with 'zksync' flag set to 'true'.`
            );
        }

        const ethNetwork = networks[zksyncNetwork].ethNetwork;
        if (ethNetwork === undefined) {
            throw new ZkSyncDeployPluginError(
                `Ethereum (layer 1) network is not configured for '${zksyncNetwork}' zkSync network in 'hardhat.config' file.`
            );
        }

        ethWeb3Provider = SUPPORTED_L1_TESTNETS.includes(ethNetwork)
            ? ethNetwork in networks
                ? new ethers.providers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                : ethers.getDefaultProvider(ethNetwork)
            : new ethers.providers.JsonRpcProvider(ethNetwork);

        zkWeb3Provider = new zk.Provider((networks[zksyncNetwork] as HttpNetworkConfig).url);

        return { ethWeb3Provider, zkWeb3Provider };
    }

    private _createDefaultEthProvider(networks: NetworksConfig): ethers.providers.BaseProvider {
        const networkUrl =
            ETH_DEFAULT_NETWORK in networks
                ? (networks[ETH_DEFAULT_NETWORK] as HttpNetworkConfig).url
                : ETH_DEFAULT_NETWORK_RPC_URL;

        return new ethers.providers.JsonRpcProvider(networkUrl);
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
        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet);

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

        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet);
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
        // Load all the dependency bytecodes.
        // We transform it into an array of bytecodes.
        const factoryDeps: string[] = [];
        for (const dependencyHash in artifact.factoryDeps) {
            const dependencyContract = artifact.factoryDeps[dependencyHash];
            const dependencyBytecodeString = (await this.hre.artifacts.readArtifact(dependencyContract)).bytecode;
            factoryDeps.push(dependencyBytecodeString);
        }

        return factoryDeps;
    }
}
