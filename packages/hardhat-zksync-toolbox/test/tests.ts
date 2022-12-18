import assert from 'assert';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { expect } from 'chai';
import * as zk from 'zksync-web3';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { useEnvironmentWithLocalSetup } from './helpers';

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';

describe('zksync toolbox plugin', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('simple');

        it('Should successfully compile a simple contract', async function () {
            await this.env.run(TASK_COMPILE);

            const artifact = this.env.artifacts.readArtifactSync('Greeter') as ZkSyncArtifact;

            assert.equal(artifact.contractName, 'Greeter');
            assert.deepEqual(artifact.factoryDeps, {}, 'Contract unexpectedly has dependencies');
        });

        it('Should deploy contract', async function () {
            const zkWallet = new zk.Wallet(RICH_WALLET_PK);
            const deployer = new Deployer(this.env, zkWallet);

            const artifact = await deployer.loadArtifact('Greeter');
            const contract = await deployer.deploy(artifact);
        });

        it('Should test for properPrivateKey chai matcher', async function () {
            expect(RICH_WALLET_PK).to.be.properPrivateKey;
        });
    });
});
