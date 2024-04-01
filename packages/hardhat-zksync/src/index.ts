import { task } from 'hardhat/config';

import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-chai-matchers';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-ethers';
import '@matterlabs/hardhat-zksync-node';

import { TASK_DEPLOY_ZKSYNC_ONELINE } from '@matterlabs/hardhat-zksync-deploy/dist/task-names';
import {
    TASK_DEPLOY_BEACON_ONELINE,
    TASK_DEPLOY_PROXY_ONELINE,
    TASK_UPGRADE_BEACON_ONELINE,
    TASK_UPGRADE_PROXY_ONELINE,
} from '@matterlabs/hardhat-zksync-upgradable/dist/src/task-names';
import {
    deployBeaconZkSyncWithOneLineAndVerify,
    deployProxyZkSyncWithOneLineAndVerify,
    deployZkSyncWithOneLineAndVerify,
    upgradeBeaconZkSyncWithOneLineAndVerify,
    upgradeProxyZkSyncWithOneLineAndVerify,
} from './task-action';
// Export Deployer class.
export { Deployer } from '@matterlabs/hardhat-zksync-deploy';

task(TASK_DEPLOY_ZKSYNC_ONELINE, 'Runs the deploy and verify from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployZkSyncWithOneLineAndVerify);

task(TASK_DEPLOY_BEACON_ONELINE, 'Runs the deploy and verify for beacon from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployBeaconZkSyncWithOneLineAndVerify);

task(TASK_DEPLOY_PROXY_ONELINE, 'Runs the deploy and verify for proxy from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployProxyZkSyncWithOneLineAndVerify);

task(
    TASK_UPGRADE_BEACON_ONELINE,
    'Runs the upgrade and verify for beacon new implementation from one line for zkSync network',
)
    .addFlag('verify', 'Contract verification flag')
    .setAction(upgradeBeaconZkSyncWithOneLineAndVerify);

task(
    TASK_UPGRADE_PROXY_ONELINE,
    'Runs the upgrade and verify for proxy new implementation from one line for zkSync network',
)
    .addFlag('verify', 'Contract verification flag')
    .setAction(upgradeProxyZkSyncWithOneLineAndVerify);
