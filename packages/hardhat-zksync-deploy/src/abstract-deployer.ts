import * as zk from 'zksync-ethers';
import { ethers } from 'ethers';
import { ZkSyncArtifact } from './types';

export interface AbstractDeployer {
    deploy(...args: any[]): Promise<zk.Contract>;
    estimateDeployFee(...args: any[]): Promise<ethers.BigNumber>;
    estimateDeployGas(...args: any[]): Promise<ethers.BigNumber>;
    loadArtifact(...args: any[]): Promise<ZkSyncArtifact>;
}
