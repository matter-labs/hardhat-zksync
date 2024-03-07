"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZkSyncProviderAdapter = void 0;
const events_1 = require("events");
class ZkSyncProviderAdapter extends events_1.EventEmitter {
    constructor(_zkSyncProvider) {
        super();
        this._zkSyncProvider = _zkSyncProvider;
    }
    async send(method, params) {
        // @ts-ignore
        return await this._zkSyncProvider.send(method, params);
    }
    async request(payload) {
        // @ts-ignore
        return await this._zkSyncProvider.send(payload.method, payload.params ?? []);
    }
    async sendAsync(payload, callback) {
        try {
            // @ts-ignore
            const result = await this._zkSyncProvider.send(payload.method, payload.params);
            callback(null, result);
        }
        catch (error) {
            callback(error);
        }
    }
}
exports.ZkSyncProviderAdapter = ZkSyncProviderAdapter;
//# sourceMappingURL=zksync-provider-adapter.js.map