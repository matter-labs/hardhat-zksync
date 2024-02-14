import * as zk from 'zksync-ethers';
import { ZkSyncArtifact } from './types';

export interface AbstractDeployer {
    deploy(...args: any[]): Promise<zk.Contract>;
    estimateDeployFee(...args: any[]): Promise<bigint>;
    estimateDeployGas(...args: any[]): Promise<any>;
    loadArtifact(...args: any[]): Promise<ZkSyncArtifact>;
    extractFactoryDeps(artifact: ZkSyncArtifact): Promise<string[]>;
}
