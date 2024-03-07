/// <reference types="node" />
import { EthereumProvider } from 'hardhat/types';
import { EventEmitter } from 'events';
import { Provider } from 'zksync-ethers';
export declare class ZkSyncProviderAdapter extends EventEmitter implements EthereumProvider {
    readonly _zkSyncProvider: Provider;
    constructor(_zkSyncProvider: Provider);
    send(method: string, params: any): Promise<any>;
    request(payload: {
        method: string;
        params?: any[];
    }): Promise<any>;
    sendAsync(payload: any, callback: (error: Error | null, result?: any) => void): Promise<void>;
}
//# sourceMappingURL=zksync-provider-adapter.d.ts.map