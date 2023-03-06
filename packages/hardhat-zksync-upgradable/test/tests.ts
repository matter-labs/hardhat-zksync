import { assert } from 'chai';
import { useEnvironment } from './helpers';

describe('verify plugin', async function () {
    const testnetVerifyURL = 'https://zksync2-testnet-explorer.zksync.dev/contract_verification';

    describe('Testnet verifyURL extraction from config', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('Reads verifyURL form network config for existing network ', async function () {
            assert.equal('https://zksync2-testnet-explorer.zksync.dev/contract_verification', testnetVerifyURL);
        });
    });
});
