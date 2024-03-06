import { expect } from 'chai';
import sinon from 'sinon';
import fse from 'fs-extra';
import { ZkSyncArtifact } from '../../src/types';
import { loadDeployment, loadDeploymentEntry, saveDeployment } from '../../src/deployment-saver';

describe('Deployment Saver', () => {
    const providerSentStub = sinon.stub();
    const provider = {
        send: providerSentStub,
    };

    const hre = {
        network: {
            provider,
            name: 'zkSyncNetwork',
            zksync: false,
        },
        config: {
            paths: {
                root: '/path/to/root/',
            },
            solidity: {
                compilers: [],
            },
        },
        run: sinon.stub(),
    };

    const existsSyncStub = sinon.stub(fse, 'existsSync').returns(false);
    const readFileSyncStub = sinon.stub(fse, 'readFileSync').returns('123456');
    const readJsonSyncStub = sinon.stub(fse, 'readJsonSync');

    let artifact: ZkSyncArtifact;

    beforeEach(() => {
        artifact = {
            contractName: 'MyContract',
            bytecode: '0x1234567890',
            abi: [{ name: 'method', inputs: [], outputs: [] }],
            _format: 'full',
            sourceName: 'contracts/MyContract.sol',
            sourceMapping: '/path/to/MyContract.sol',
            factoryDeps: {},
            deployedBytecode: '0x1234567890',
            deployedLinkReferences: {},
            linkReferences: {},
        };
    });

    describe('loadDeployment', () => {
        it('should return undefined if deployment file does not exist', async () => {
            existsSyncStub.returns(false);

            const result = await loadDeployment(hre as any, artifact);

            expect(result).to.be.equal(undefined);
            expect(
                existsSyncStub.calledOnceWithExactly(
                    '/path/to/root/deployments-zk/zkSyncNetwork/contracts/MyContract.sol/MyContract.json',
                ),
            ).to.be.equal(true);
        });

        it('should return undefined if chain ID in deployment file does not match current chain ID', async () => {
            existsSyncStub.returns(true);
            readFileSyncStub.returns('23333');
            providerSentStub.returns('123456');
            const result = await loadDeployment(hre as any, artifact);

            expect(result).to.be.equal(undefined);
        });

        it('should return undefined if bytecode in deployment file does not match artifact bytecode', async () => {
            existsSyncStub.returns(true);
            readFileSyncStub.returns('123456');
            providerSentStub.returns('123456');
            readJsonSyncStub.returns({
                bytecode: '0x0987654321',
                abi: [],
            });

            const result = await loadDeployment(hre as any, artifact);

            expect(result).to.be.equal(undefined);
        });

        it('should return undefined if ABI in deployment file does not match artifact ABI', async () => {
            existsSyncStub.returns(true);
            readFileSyncStub.returns('123456');
            providerSentStub.returns('123456');
            readJsonSyncStub.returns({
                bytecode: '0x1234567890',
                abi: [{ name: 'something', inputs: [], outputs: [] }],
            });

            const result = await loadDeployment(hre as any, artifact);

            expect(result).to.be.equal(undefined);
        });

        it('should return the deployment if all conditions are met', async () => {
            existsSyncStub.returns(true);
            readFileSyncStub.returns('123456');
            providerSentStub.returns('123456');
            readJsonSyncStub.returns({
                bytecode: '0x1234567890',
                abi: [{ name: 'method', inputs: [], outputs: [] }],
            });

            const result = await loadDeployment(hre as any, artifact);

            expect(result).to.deep.equal({
                bytecode: '0x1234567890',
                abi: [{ name: 'method', inputs: [], outputs: [] }],
            });
        });
    });

    describe('saveDeployment', () => {
        const mkdirpSyncStub = sinon.stub(fse, 'mkdirpSync');
        const writeFileSyncStub = sinon.stub(fse, 'writeFileSync');
        const writeJsonSyncStub = sinon.stub(fse, 'writeJsonSync');

        beforeEach(() => {
            mkdirpSyncStub.reset();
            writeFileSyncStub.reset();
            writeJsonSyncStub.reset();
        });

        it('should write the chain ID to a file', async () => {
            providerSentStub.returns('123456');

            await saveDeployment(
                hre as any,
                {
                    contractName: 'Something.sol',
                    sourceName: 'contracts/Something.sol',
                } as any,
            );

            expect(
                writeFileSyncStub.calledOnceWithExactly(
                    '/path/to/root/deployments-zk/zkSyncNetwork/.chainId',
                    '123456',
                ),
            ).to.be.eqls(true);
        });

        it('should write the deployment to a JSON file', async () => {
            const deployment = {
                contractName: 'MyContract',
                sourceName: 'contracts/subFolder/MyContract.sol',
                bytecode: '0x1234567890',
                abi: [],
                entries: [],
            };

            await saveDeployment(hre as any, deployment);

            expect(
                writeJsonSyncStub.calledOnceWithExactly(
                    '/path/to/root/deployments-zk/zkSyncNetwork/contracts/subFolder/MyContract.sol/MyContract.json',
                    deployment,
                    { spaces: 2 },
                ),
            ).to.be.equal(true);
        });
    });

    describe('loadDeploymentEntry', () => {
        let deployment: any;
        let deploymentForFound: any;

        beforeEach(() => {
            providerSentStub.returns('0x1234567890');
            deployment = {
                entries: [
                    {
                        constructorArgs: [1, 2, 3],
                        salt: 'salt1',
                        deploymentType: 'type1',
                        address: '0x1234567890',
                        factoryDeps: ['1234', '3242'],
                    },
                    {
                        constructorArgs: [4, 5, 6],
                        salt: 'salt2',
                        deploymentType: 'type2',
                        address: '0x0987654321',
                        factoryDeps: [],
                    },
                ],
                bytecode: '0x1234567890',
                contractName: 'MyContract',
                sourceName: 'contracts/MyContract.sol',
            };
            deploymentForFound = {
                constructorArgs: [1, 2, 3],
                salt: 'salt1',
                deploymentType: 'type1',
                factoryDeps: ['3242', '1234'],
            };
        });

        it('should return the deployment entry if found', async () => {
            const entry = await loadDeploymentEntry(hre as any, deployment, deploymentForFound);

            expect(entry).to.deep.equal({
                constructorArgs: [1, 2, 3],
                salt: 'salt1',
                deploymentType: 'type1',
                factoryDeps: ['1234', '3242'],
                address: '0x1234567890',
            });

            expect(deployment.entries.length).to.have.eqls(2);
        });

        it('should return undefined if deployment entry not found', async () => {
            deploymentForFound = {
                constructorArgs: [7, 8, 9],
                salt: 'salt3',
                deploymentType: 'type3',
                factoryDeps: [],
            };

            const entry = await loadDeploymentEntry(hre as any, deployment, deploymentForFound);

            expect(entry).to.be.equal(undefined);
        });

        it('should return undefined if retrieved contract bytecode does not match deployment bytecode', async () => {
            deployment.bytecode = '0x0987654321';

            const entry = await loadDeploymentEntry(hre as any, deployment, deploymentForFound);

            expect(entry).to.be.eqls(undefined);
        });
    });
});
