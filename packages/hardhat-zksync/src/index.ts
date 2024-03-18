import { task } from 'hardhat/config';

import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-chai-matchers';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-upgradable';
import '@matterlabs/hardhat-zksync-ethers';
import '@matterlabs/hardhat-zksync-node';

import { TASK_DEPLOY_ZKSYNC_ONELINE } from '@matterlabs/hardhat-zksync-deploy/src/task-names';
import { deployZkSyncWithOneLineAndVerify } from './task-action';
// Export Deployer class.
export { Deployer } from '@matterlabs/hardhat-zksync-deploy';

task(TASK_DEPLOY_ZKSYNC_ONELINE, 'Runs the deploy and verify from one line for zkSync network')
    .addFlag('verify', 'Contract verification flag')
    .setAction(deployZkSyncWithOneLineAndVerify);
