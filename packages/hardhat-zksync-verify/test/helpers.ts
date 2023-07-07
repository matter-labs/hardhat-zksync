import { resetHardhatContext } from 'hardhat/plugins-testing';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet, Provider } from 'zksync-web3';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy/src/deployer';
import path from 'path';
import { TASK_COMPILE, TESTNET_URL } from '../src/constants';

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

        const PRIVATE_KEY: any = process.env.PRIVATE_KEY;
        const zkSyncProvider = new Provider(TESTNET_URL);

        const zkWallet = new Wallet(PRIVATE_KEY, zkSyncProvider);
        this.deployer = new Deployer(this.env, zkWallet);

        this.deployedAddress = '0x000000';
    });

    after('Resetting hardhat', function () {
        resetHardhatContext();
    });
}
