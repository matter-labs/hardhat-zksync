import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';
import { Wallet, Provider } from 'zksync-web3';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import { ethers } from 'ethers';
import { LOCAL_SETUP_ZKSYNC_NETWORK } from '../src/constants';
import { LOCAL_SETUP_RICH_WALLET_PRIVATE_KEY } from './constants';

declare module 'mocha' {
    interface Context {
        env: HardhatRuntimeEnvironment;
    }
}

export function useEnvironment(fixtureProjectName: string, networkName = 'hardhat') {
    beforeEach('Loading hardhat environment', async function () {
        process.chdir(path.join(__dirname, 'fixture-projects', fixtureProjectName));
        process.env.HARDHAT_NETWORK = networkName;

        this.env = require('hardhat');
        await this.env.run(TASK_COMPILE);

        const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
        const zkWallet = Wallet.fromMnemonic(testMnemonic, "m/44'/60'/0'/0/0");

        const zkSyncProvider = new Provider(LOCAL_SETUP_ZKSYNC_NETWORK);
        const ethProvider = ethers.getDefaultProvider('goerli');
        zkWallet.connect(zkSyncProvider);

        const privateKey = LOCAL_SETUP_RICH_WALLET_PRIVATE_KEY;
        this.zkWallet2 = new Wallet(privateKey, zkSyncProvider, ethProvider);

        this.deployer = new Deployer(this.env, zkWallet);
    });

    afterEach('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
