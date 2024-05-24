import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import { AbstractDeployer } from './abstract-deployer';
import { ZkSyncArtifact } from './types';
import {
    Providers,
    createProviders,
    deploy,
    estimateDeployFee,
    estimateDeployGas,
    _extractFactoryDeps,
    loadArtifact,
} from './deployer-helper';

import { getNetworkAccount, getWallet } from './plugin';

export class DeployerExtension implements AbstractDeployer {
    private ethWeb3Provider?: ethers.Provider;
    private zkWeb3Provider?: zk.Provider;
    private wallet?: zk.Wallet;

    constructor(private _hre: HardhatRuntimeEnvironment) {}

    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        return await loadArtifact(this._hre, contractNameOrFullyQualifiedName);
    }

    public async deploy(
        contractNameOrArtifact: ZkSyncArtifact | string,
        constructorArguments: any[] = [],
        deploymentType?: zk.types.DeploymentType,
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ): Promise<zk.Contract> {
        if (!this.wallet) {
            this.wallet = await this.getWallet();
        }

        return await deploy(
            this._hre,
            contractNameOrArtifact,
            constructorArguments,
            this.wallet,
            deploymentType,
            overrides,
            additionalFactoryDeps,
        );
    }

    public async estimateDeployFee(artifact: ZkSyncArtifact, constructorArguments: any[]): Promise<bigint> {
        if (!this.wallet) {
            this.wallet = await this.getWallet();
        }

        return await estimateDeployFee(this._hre, artifact, constructorArguments, this.wallet);
    }

    public async estimateDeployGas(
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        deploymentType?: zk.types.DeploymentType,
    ): Promise<bigint> {
        if (!this.wallet) {
            this.wallet = await this.getWallet();
        }

        return await estimateDeployGas(this._hre, artifact, constructorArguments, this.wallet, deploymentType);
    }

    public setWallet(wallet: zk.Wallet): void {
        this.wallet = wallet;
    }

    public async getWallet(privateKeyOrAccountNumber?: string | number): Promise<zk.Wallet> {
        if (!this.ethWeb3Provider || !this.zkWeb3Provider) {
            const { ethWeb3Provider, zkWeb3Provider }: Providers = createProviders(
                this._hre.config.networks,
                this._hre.network,
            );
            this.ethWeb3Provider = ethWeb3Provider;
            this.zkWeb3Provider = zkWeb3Provider;
        }

        const wallet = (await getWallet(this._hre, privateKeyOrAccountNumber ?? getNetworkAccount(this._hre)))
            .connect(this.zkWeb3Provider)
            .connectToL1(this.ethWeb3Provider);
        return wallet;
    }
}
