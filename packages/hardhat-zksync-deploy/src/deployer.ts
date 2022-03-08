import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';
import * as ethers from 'ethers';

import { ZkSyncArtifact } from './types';
import { pluginError } from './helpers';

const ARTIFACT_FORMAT_VERSION = 'hh-zksolc-artifact-1';
const SUPPORTED_L1_TESTNETS = ['mainnet', 'rinkeby', 'ropsten', 'kovan', 'goerli'];

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer {
    public hre: HardhatRuntimeEnvironment;
    public ethWallet: ethers.Wallet;
    public zkWallet: zk.Wallet;

    constructor(hre: HardhatRuntimeEnvironment, zkWallet: zk.Wallet) {
        this.hre = hre;

        // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2). We will need both.
        const ethNetwork = hre.config.zkSyncDeploy.ethNetwork;
        const ethWeb3Provider = SUPPORTED_L1_TESTNETS.includes(ethNetwork)
            ? ethers.getDefaultProvider(ethNetwork)
            : new ethers.providers.JsonRpcProvider(ethNetwork);
        const zkWeb3Provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncNetwork);

        this.zkWallet = zkWallet.connect(zkWeb3Provider).connectToL1(ethWeb3Provider);
        this.ethWallet = this.zkWallet.ethWallet();
    }

    static fromEthWallet(hre: HardhatRuntimeEnvironment, ethWallet: ethers.Wallet) {
        return new Deployer(hre, new zk.Wallet(ethWallet.privateKey));
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
        if (artifact._format !== ARTIFACT_FORMAT_VERSION) {
            throw pluginError(`Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc`);
        }
        return artifact as ZkSyncArtifact;
    }

    /**
     * Estimates the price of calling a deploy transaction in a certain fee token.
     *
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     * @param feeToken Address of the token to pay fees in. If not provided, defaults to ETH.
     *
     * @returns Calculated fee in wei of the corresponding fee token.
     */
    public async estimateDeployFee(
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        feeToken?: string
    ): Promise<ethers.BigNumber> {
        const factoryDeps = await this.extractFactoryDeps(artifact);
        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet);

        // Encode deploy transaction so it can be estimated.
        const deployTx = factory.getDeployTransaction(...constructorArguments, {
            customData: {
                factoryDeps,
                feeToken: feeToken ?? zk.utils.ETH_ADDRESS,
            },
        });
        deployTx.from = this.zkWallet.address;

        const gas = await this.zkWallet.provider.estimateGas(deployTx);
        const gasPrice = await this.zkWallet.provider.getGasPrice();

        return gas.mul(gasPrice);
    }

    /**
     * Sends a deploy transaction to the zkSync network.
     * For now, it will use defaults for the transaction parameters:
     * - fee amount is requested automatically from the zkSync server.
     *
     * @param artifact The previously loaded artifact object.
     * @param constructorArguments List of arguments to be passed to the contract constructor.
     * @param feeToken Address of the token to pay fees in. If not provided, defaults to ETH.
     *
     * @returns A contract object.
     */
    public async deploy(
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        feeToken?: string
    ): Promise<zk.Contract> {
        const factoryDeps = await this.extractFactoryDeps(artifact);
        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, this.zkWallet);

        // Encode and send the deploy transaction providing both fee token and factory dependencies.
        const contract = await factory.deploy(...constructorArguments, {
            customData: {
                factoryDeps,
                feeToken: feeToken ?? zk.utils.ETH_ADDRESS,
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
