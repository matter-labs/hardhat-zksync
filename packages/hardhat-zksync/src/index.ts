import { task } from 'hardhat/config';

import '@matterlabs/hardhat-zksync-node';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-ethers';

import { TASK_DEPLOY_ZKSYNC_CONTRACT } from '@matterlabs/hardhat-zksync-deploy/dist/task-names';
import {
    TASK_DEPLOY_ZKSYNC_BEACON,
    TASK_DEPLOY_ZKSYNC_PROXY,
    TASK_UPGRADE_ZKSYNC_BEACON,
    TASK_UPGRADE_ZKSYNC_PROXY,
} from '@matterlabs/hardhat-zksync-upgradable/dist/src/task-names';
import {
    deployZkSyncBeaconAndVerify,
    deployZkSyncContractAndVerify,
    deployZkSyncProxyAndVerify,
    upgradeZkSyncBeaconAndVerify,
    upgradeZkSyncProxyAndVerify,
} from './task-action';
// Export Deployer class.
export { Deployer } from '@matterlabs/hardhat-zksync-deploy';

task(TASK_DEPLOY_ZKSYNC_CONTRACT, 'Runs the deploy and verify from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployZkSyncContractAndVerify);

task(TASK_DEPLOY_ZKSYNC_BEACON, 'Runs the deploy and verify for beacon from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployZkSyncBeaconAndVerify);

task(TASK_DEPLOY_ZKSYNC_PROXY, 'Runs the deploy and verify for proxy from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployZkSyncProxyAndVerify);

task(
    TASK_UPGRADE_ZKSYNC_BEACON,
    'Runs the upgrade and verify for beacon new implementation from one line for zkSync network',
)
    .addFlag('verify', 'Contract verification flag')
    .setAction(upgradeZkSyncBeaconAndVerify);

task(
    TASK_UPGRADE_ZKSYNC_PROXY,
    'Runs the upgrade and verify for proxy new implementation from one line for zkSync network',
)
    .addFlag('verify', 'Contract verification flag')
    .setAction(upgradeZkSyncProxyAndVerify);
