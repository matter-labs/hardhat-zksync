import {Provider} from 'zksync-ethers'
import { EthereumProvider } from 'hardhat/types';
import EventEmitter from 'events';


export class ZkSyncProviderAdapter extends EventEmitter implements EthereumProvider {
    constructor(public readonly _zkSyncProvider: Provider) {
        super();
    }

    public async send(method: string, params: any): Promise<any> {
        return await this._zkSyncProvider.send(method, params);
    }

    public async request(payload: { method: string; params?: any[] }): Promise<any> {
        return await this._zkSyncProvider.send(payload.method, payload.params ?? []);
    }

    public async sendAsync(payload: any, callback: (error: Error | null, result?: any) => void): Promise<void> {
        try {
            const result = await this._zkSyncProvider.send(payload.method, payload.params);
            callback(null, result);
        } catch (error) {
            callback(error as Error);
        }
    }
}