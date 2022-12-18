import assert from 'assert';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { expect } from 'chai';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { TASK_DEPLOY_ZKSYNC } from '@matterlabs/hardhat-zksync-deploy/src/task-names';
import { TASK_VERIFY } from '@matterlabs/hardhat-zksync-verify/src/constants';

import { useEnvironmentWithLocalSetup } from './helpers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('zksync toolbox plugin', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('simple');

        it('All tasks should be registered in HRE', async function () {
            const taskNames = Object.keys(this.env['tasks']);

            assert(taskNames.includes(TASK_COMPILE));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC));
            assert(taskNames.includes(TASK_VERIFY));
        });

        it('Should successfully compile a simple contract', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');
            assert.deepEqual(artifact.factoryDeps, {}, 'Contract unexpectedly has dependencies');
        });

        it('Should call deploy scripts through HRE', async function () {
            await this.env.run(TASK_DEPLOY_ZKSYNC);
        });

        it('Should test for properPrivateKey chai matcher', async function () {
            expect(RICH_WALLET_PK).to.be.properPrivateKey;
        });

        it('Reads verifyURL form network config for existing network ', async function () {
            const testnetVerifyURL = 'https://zksync2-testnet-explorer.zksync.dev/contract_verification';

            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });
});
