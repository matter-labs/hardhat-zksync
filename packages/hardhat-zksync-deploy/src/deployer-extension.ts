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
    loadArtifact,
} from './deployer-helper';

import { getNetworkAddress, getWallet } from './plugin';

export class DeployerExtension implements AbstractDeployer {
    private ethWeb3Provider?: ethers.Provider;
    private zkWeb3Provider?: zk.Provider;

    constructor(
        private _hre: HardhatRuntimeEnvironment,
        private _deploymentType?: zk.types.DeploymentType,
    ) {}

    public setDeploymentType(deploymentType: zk.types.DeploymentType) {
        this._deploymentType = deploymentType;
    }

    public async loadArtifact(contractNameOrFullyQualifiedName: string): Promise<ZkSyncArtifact> {
        return await loadArtifact(this._hre, contractNameOrFullyQualifiedName);
    }

    public async deploy(
        artifact: ZkSyncArtifact,
        constructorArguments: any[] = [],
        forceDeploy: boolean = false,
        zkWallet?: zk.Wallet,
        overrides?: ethers.Overrides,
        additionalFactoryDeps?: ethers.BytesLike[],
    ): Promise<zk.Contract> {
        if (!zkWallet) {
            zkWallet = await this.getWallet(getNetworkAddress(this._hre));
        }

        return await deploy(
            this._hre,
            artifact,
            constructorArguments,
            forceDeploy,
            zkWallet,
            this._deploymentType,
            overrides,
            additionalFactoryDeps,
        );
    }

    public async estimateDeployFee(
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        zkWallet?: zk.Wallet,
    ): Promise<bigint> {
        if (!zkWallet) {
            zkWallet = await this.getWallet(getNetworkAddress(this._hre));
        }

        return await estimateDeployFee(this._hre, artifact, constructorArguments, zkWallet);
    }

    public async estimateDeployGas(
        artifact: ZkSyncArtifact,
        constructorArguments: any[],
        zkWallet?: zk.Wallet,
    ): Promise<any> {
        if (!zkWallet) {
            zkWallet = await this.getWallet(getNetworkAddress(this._hre));
        }

        return await estimateDeployGas(this._hre, artifact, constructorArguments, zkWallet, this._deploymentType);
    }

    public async getWallet(privateKeyOrAccountNumber: string | number): Promise<zk.Wallet> {
        if (!this.ethWeb3Provider || !this.zkWeb3Provider) {
            const { ethWeb3Provider, zkWeb3Provider }: Providers = createProviders(
                this._hre.config.networks,
                this._hre.network,
            );
            this.ethWeb3Provider = ethWeb3Provider;
            this.zkWeb3Provider = zkWeb3Provider;
        }

        const wallet = await getWallet(this._hre, privateKeyOrAccountNumber);
        return wallet.connect(this.zkWeb3Provider).connectToL1(this.ethWeb3Provider);
    }
}
