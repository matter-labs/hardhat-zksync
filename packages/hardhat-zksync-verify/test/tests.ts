import { assert } from 'chai';
import { useEnvironment } from './helpers';
import { Build } from '../src/types';
import { TASK_VERIFY_GET_MINIMUM_BUILD } from '../src/constants';
import { encodeArguments } from '../src/utils';

describe('verify plugin', async function () {
    const sourceName: string = 'contracts/Greeter.sol';
    const contractName: string = 'Greeter';
    const testnetVerifyURL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

    describe('Testnet verifyURL extraction from config', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('Reads verifyURL form network config for existing network ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('Unknown verifyURL in config', async function () {
        useEnvironment('localGreeter', 'customNetwork');

        it('Checks impoting deafault verifyURL when it does not exist in the config ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });
});
