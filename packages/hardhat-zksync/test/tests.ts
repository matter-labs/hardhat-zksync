import assert from 'assert';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import * as chai from 'chai';
import { expect } from 'chai';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { TASK_VERIFY } from '@matterlabs/hardhat-zksync-verify/src/constants';

import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { HardhatRuntimeEnvironment, RunSuperFunction, TaskArguments } from 'hardhat/types';
import {
    TASK_DEPLOY_ZKSYNC_BEACON,
    TASK_DEPLOY_ZKSYNC_PROXY,
    TASK_UPGRADE_ZKSYNC_BEACON,
    TASK_UPGRADE_ZKSYNC_PROXY,
} from '@matterlabs/hardhat-zksync-upgradable/src/task-names';
import { TASK_DEPLOY_ZKSYNC_CONTRACT, TASK_DEPLOY_ZKSYNC } from '@matterlabs/hardhat-zksync-deploy/src/task-names';
import { TASK_DEPLOY_ZKSYNC_LIBRARIES } from '@matterlabs/hardhat-zksync-deploy/dist/task-names';
import {
    deployBeaconAndVerify,
    deployContractAndVerify,
    deployProxyAndVerify,
    upgradeBeaconAndVerify,
    upgradeProxyAndVerify,
} from '../src/plugin';
import { useEnvironmentWithLocalSetup } from './helpers';

chai.use(sinonChai);

describe('zksync toolbox plugin', function () {
    describe('with the local setup', function () {
        useEnvironmentWithLocalSetup('simple');

        it('All tasks should be registered in HRE', async function () {
            const taskNames = Object.keys(this.env.tasks);

            assert(taskNames.includes(TASK_COMPILE));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC_LIBRARIES));
            assert(taskNames.includes(TASK_VERIFY));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC_BEACON));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC_PROXY));
            assert(taskNames.includes(TASK_UPGRADE_ZKSYNC_BEACON));
            assert(taskNames.includes(TASK_UPGRADE_ZKSYNC_PROXY));
            assert(taskNames.includes(TASK_DEPLOY_ZKSYNC_CONTRACT));
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

        it('Reads verifyURL form network config for existing network ', async function () {
            const testnetVerifyURL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('deployContractAndVerify', () => {
        const sandbox = sinon.createSandbox();
        let hre: HardhatRuntimeEnvironment;
        let runSuper: RunSuperFunction<TaskArguments>;
        const artifact = {
            sourceName: 'contracts/MyContract.sol',
            contractName: 'MyContract',
        };

        this.beforeEach(() => {
            runSuper = sandbox.stub().resolves({
                getAddress: async () => '0x1234567890123456789012345678901234567890',
                abi: [],
            }) as any;
            hre = {
                deployer: {
                    loadArtifact: sandbox.stub().resolves(artifact),
                },
                run: sandbox.stub(),
            } as any;
        });

        afterEach(() => {
            sandbox.restore();
        });

        const taskArgs = {
            contractName: 'MyContract',
            constructorArgsParams: [],
            constructorArgs: undefined,
            noCompile: false,
            verify: true,
        };

        it('should deploy the contract and verify it', async () => {
            await deployContractAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.deployer.loadArtifact).to.have.been.calledOnceWith(taskArgs.contractName);
            expect(hre.run).to.have.been.calledOnceWith('verify', {
                contract: `${artifact.sourceName}:${artifact.contractName}`,
                address: '0x1234567890123456789012345678901234567890',
                constructorArgsParams: taskArgs.constructorArgsParams,
                constructorArgs: taskArgs.constructorArgs,
                noCompile: true,
            });
        });

        it('should deploy the contract without verifying it', async () => {
            taskArgs.verify = false;
            await deployContractAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.run).to.have.been.callCount(0);
        });
    });

    describe('deployBeaconAndVerify', () => {
        const sandbox = sinon.createSandbox();
        let hre: HardhatRuntimeEnvironment;
        let runSuper: RunSuperFunction<TaskArguments>;
        const artifact = {
            sourceName: 'contracts/Box.sol',
            contractName: 'Box',
        };

        this.beforeEach(() => {
            runSuper = sandbox.stub().resolves({
                proxy: {
                    getAddress: async () => '0x1234567890123456789012345678901234567890',
                    abi: [],
                },
                beacon: {
                    getAddress: async () => '0x1234567890123456789012345678901234567890',
                    abi: [],
                },
            }) as any;
            hre = {
                zkUpgrades: {
                    deployBeacon: sandbox.stub().resolves(artifact),
                },
                run: sandbox.stub(),
            } as any;
        });

        afterEach(() => {
            sandbox.restore();
        });

        const taskArgs = {
            contractName: 'Box',
            constructorArgsParams: [],
            constructorArgs: undefined,
            noCompile: false,
            verify: true,
        };

        it('should deploy the beacon contract and verify it', async () => {
            await deployBeaconAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.run).to.have.been.calledOnceWith('verify', {
                address: '0x1234567890123456789012345678901234567890',
                noCompile: true,
            });
        });

        it('should deploy the contract without verifying it', async () => {
            taskArgs.verify = false;
            await deployBeaconAndVerify(hre, runSuper, taskArgs);

            expect(runSuper).to.have.been.calledOnceWith(taskArgs);
            expect(hre.run).to.have.been.callCount(0);
        });

        it('should upgrade contract without verifying it', async () => {
            taskArgs.verify = false;
            taskArgs.contractName = 'BoxV2';
            const newTaskArgs = {
                ...taskArgs,
                beaconAddress: '0x1234567890123456789012345678901234567890',
            };
            await upgradeBeaconAndVerify(hre, runSuper, newTaskArgs);

            expect(runSuper).to.have.been.calledOnceWith(newTaskArgs);
            expect(hre.run).to.have.been.callCount(0);
        });
    });
});

describe('deployProxyAndVerify', () => {
    const sandbox = sinon.createSandbox();
    let hre: HardhatRuntimeEnvironment;
    let runSuper: RunSuperFunction<TaskArguments>;

    beforeEach(() => {
        runSuper = sandbox.stub().resolves({
            getAddress: async () => '0x1234567890123456789012345678901234567890',
            abi: [],
        }) as any;
        hre = {
            run: sandbox.stub(),
        } as any;
    });

    afterEach(() => {
        sandbox.restore();
    });

    const taskArgs = {
        contractName: 'Box',
        constructorArgsParams: [],
        constructorArgs: undefined,
        noCompile: false,
        verify: true,
    };

    it('should deploy the proxy contract and verify it', async () => {
        await deployProxyAndVerify(hre, runSuper, taskArgs);

        expect(runSuper).to.have.been.calledOnceWith(taskArgs);
        expect(hre.run).to.have.been.calledOnceWith('verify', {
            address: '0x1234567890123456789012345678901234567890',
            noCompile: true,
        });
    });

    it('should deploy the proxy without verifying it', async () => {
        taskArgs.verify = false;
        await deployProxyAndVerify(hre, runSuper, taskArgs);

        expect(runSuper).to.have.been.calledOnceWith(taskArgs);
        expect(hre.run).to.have.been.callCount(0);
    });

    it('should upgrade proxy without verifying it', async () => {
        taskArgs.verify = false;
        taskArgs.contractName = 'BoxV2';
        const newTaskArgs = {
            ...taskArgs,
            proxyAddress: '0x1234567890123456789012345678901234567890',
        };
        await upgradeProxyAndVerify(hre, runSuper, newTaskArgs);

        expect(runSuper).to.have.been.calledOnceWith(newTaskArgs);
        expect(hre.run).to.have.been.callCount(0);
    });
});