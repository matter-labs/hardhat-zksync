import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { Wallet, Provider } from 'zksync-ethers';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';

import { LOCAL_SETUP_ZKSYNC_NETWORK } from '../src/constants';
import richWallets from './rich-wallets.json';

declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironment(fixtureProjectName: string, networkName = 'hardhat') {
    before('Loading hardhat environment', async function () {
        process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));
        process.env.HARDHAT_NETWORK = networkName;

        this.env = require('hardhat');
        await this.env.run(TASK_COMPILE);

        const zkSyncProvider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);

        const zkWallet = new Wallet(richWallets[0].privateKey, zkSyncProvider);
        this.deployer = new Deployer(this.env, zkWallet);

        this.zkWallet2 = new Wallet(richWallets[1].privateKey, zkSyncProvider);
    });

    after('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
