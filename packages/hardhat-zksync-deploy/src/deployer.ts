import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';

import { ZkSyncArtifact } from './types';
import { createProviders, deploy, estimateDeployFee, estimateDeployGas, loadArtifact } from './deployer-helper';
import { AbstractDeployer } from './abstract-deployer';

/**
 * An entity capable of deploying contracts to the zkSync network.
 */
export class Deployer implements AbstractDeployer {
    public ethWallet: ethers.Wallet;
    public zkWallet: zk.Wallet;
    public deploymentType?: zk.types.DeploymentType;

    constructor(
        private _hre: HardhatRuntimeEnvironment,
        zkWallet: zk.Wallet,
        deploymentType?: zk.types.DeploymentType,
    ) {
        this.deploymentType = deploymentType;

        // Initalize two providers: one for the Ethereum RPC (layer 1), and one for the zkSync RPC (layer 2).
        const { ethWeb3Provider, zkWeb3Provider } = createProviders(_hre.config.networks, _hre.network);

        const l2Provider = zkWallet.provider === null ? zkWeb3Provider : zkWallet.provider;

        this.zkWallet = zkWallet.connect(l2Provider).connectToL1(ethWeb3Provider);
        this.ethWallet = this.zkWallet.ethWallet();
    }

    public static fromEthWallet(
        hre: HardhatRuntimeEnvironment,
        ethWallet: ethers.Wallet,
        deploymentType?: zk.types.DeploymentType,
    ) {
        return new Deployer(hre, new zk.Wallet(ethWallet.privateKey), deploymentType);
    }

    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        return await loadArtifact(this._hre, contractNameOrFullyQualifiedName);
    }

    public async estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<ethers.BigNumber> {
        return await estimateDeployFee(this._hre, artifact, constructorArguments, this.zkWallet);
    }

    public async estimateDeployGas(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<ethers.BigNumber> {
        return await estimateDeployGas(this._hre, artifact, constructorArguments, this.zkWallet, this.deploymentType);
    }

    public async deploy(
        contractNameOrArtifact: ZkSyncArtifact | string,
        constructorArguments: any[] = [],
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ): Promise<zk.Contract> {
        return await deploy(
            this._hre,
            contractNameOrArtifact,
            constructorArguments,
            this.zkWallet,
            this.deploymentType,
            overrides,
            additionalFactoryDeps,
        );
    }
}
