import { assert } from 'chai';
import { TASK_VERIFY_GET_ARTIFACT } from '../src/constants';
import { getCacheResolvedFileInformation } from '../src/plugin';
import { useEnvironment } from './helpers';

describe('verify plugin', async function () {
    const sourceName: string = 'contracts/Greeter.vy';
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

    describe('Artifact cache information', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('Verifies contract with provided source name', async function () {
            const contractName = 'contracts/Greeter.vy:Greeter';
            const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, {
                contractFQN: contractName,
                deployedBytecode: '0x',
            });

            const { resolvedFile, contractCache } = await getCacheResolvedFileInformation(
                sourceName,
                artifact.sourceName,
                this.env
            );

            assert.equal(resolvedFile.sourceName, sourceName);
            assert.equal(contractCache.sourceName, sourceName);
            assert.equal(contractCache.vyperConfig.version, '0.3.3');
        });
    });
});
