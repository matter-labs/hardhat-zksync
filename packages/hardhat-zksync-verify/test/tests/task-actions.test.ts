import { assert, expect } from 'chai';
import sinon from 'sinon';
import { fail } from 'assert';

import { ZKSOLC_COMPILER_PATH_VERSION } from '@matterlabs/hardhat-zksync-solc/dist/src/constants';
import { getCompilerVersions, getConstructorArguments, getContractInfo, verify } from '../../src/task-actions';
import { NO_MATCHING_CONTRACT, TASK_VERIFY_ZKSYNC_ETHERSCAN, USING_COMPILER_PATH_ERROR } from '../../src/constants';
import * as utils from '../../src/utils';

import * as plugin from '../../src/plugin';
import * as bytecode from '../../src/solc/bytecode';

describe('getCompilerVersions', async function () {
    it('should call runSuper if zksync is false', async function () {
        const runSuperStub = sinon.stub().resolves([]);
        const hre = {
            network: {
                zksync: false,
            },
            config: {
                solidity: {
                    compilers: [],
                },
            },
            run: sinon.stub(),
        };

        const result = await getCompilerVersions({}, hre as any, runSuperStub as any);
        expect(result).to.deep.equal([]);
        expect(runSuperStub.calledOnce).to.equal(true);
    });

    it('should return compiler versions if zksync is true', async function () {
        const runSuperStub = sinon.stub().resolves([]);
        const hre = {
            network: {
                zksync: true,
            },
            config: {
                zksolc: {
                    version: '1.5.0',
                },
                solidity: {
                    compilers: [{ version: '0.8.0' }, { version: '0.7.0' }],
                    overrides: {
                        'contracts/Contract.sol': { version: '0.6.0' },
                    },
                },
            },
            userConfig: {
                solidity: {
                    compilers: [{ version: '0.8.0' }, { version: '0.7.0' }],
                    overrides: {
                        'contracts/Contract.sol': { version: '0.6.0' },
                    },
                },
            },
            run: sinon.stub(),
        };

        const result = await getCompilerVersions({}, hre as any, runSuperStub as any);
        expect(result).to.deep.equal(['zkVM-0.8.0-1.0.2', 'zkVM-0.7.0-1.0.2', 'zkVM-0.6.0-1.0.2']);
        expect(runSuperStub.called).to.equal(false);
    });

    it('should fail if compiler is using remote or origin source', async function () {
        const runSuperStub = sinon.stub().resolves([]);
        const hre = {
            network: {
                zksync: true,
            },
            config: {
                zksolc: {
                    version: ZKSOLC_COMPILER_PATH_VERSION,
                    settings: {
                        compilerPath: 'remote/path',
                    },
                },
                solidity: {
                    compilers: [{ version: '0.8.0' }, { version: '0.7.0' }],
                    overrides: {
                        'contracts/Contract.sol': { version: '0.6.0' },
                    },
                },
            },
            userConfig: {
                solidity: {
                    compilers: [{ version: '0.8.0' }, { version: '0.7.0' }],
                    overrides: {
                        'contracts/Contract.sol': { version: '0.6.0' },
                    },
                },
            },
            run: sinon.stub(),
        };

        try {
            await getCompilerVersions({}, hre as any, runSuperStub as any);
        } catch (error: any) {
            expect(error.message).to.equal(USING_COMPILER_PATH_ERROR);
        }
    });
});

describe('verify', async function () {
    afterEach(() => {
        sinon.restore();
    });

    it('should call runSuper if zksync is false', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            config: {
                zksolc: {
                    version: 'latest',
                },
            },
            network: {
                zksync: false,
                verifyURL: 'http://localhost:3000/verify',
            },
            run: sinon.stub().resolves({}),
        };
        await verify(
            {
                address: '0x1234567890',
                constructorArgs: '',
                contract: '',
                constructorArgsParams: [],
                libraries: '',
                noCompile: false,
            },
            hre as any,
            runSuperStub as any,
        );

        expect(runSuperStub.calledOnce).to.equal(true);
    });

    it('should call run with the correct arguments', async function () {
        sinon.stub(plugin, 'getLibraries').resolves({});
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: true,
                verifyURL: 'http://localhost:3000/verify',
            },
            run: sinon
                .stub()
                .onFirstCall()
                .resolves({})
                .onSecondCall()
                .resolves([
                    {
                        label: 'ZkSyncEtherscan',
                        subtaskName: TASK_VERIFY_ZKSYNC_ETHERSCAN,
                    },
                ]),
        };

        await verify(
            {
                address: '0x1234567890',
                constructorArgs: '',
                contract: 'Contract',
                constructorArgsParams: [],
                libraries: '',
                noCompile: false,
            },
            hre as any,
            runSuperStub as any,
        );

        expect(runSuperStub.calledOnce).to.equal(false);
        expect(hre.run.firstCall.args[0]).to.equal('verify:resolve-arguments');
        expect(hre.run.secondCall.args[0]).to.equal('verify:get-verification-subtasks');
        expect(hre.run.thirdCall.args[0]).to.equal('verify:zksync-etherscan');
    });
});
describe('getConstructorArguments', async function () {
    afterEach(() => {
        sinon.restore();
    });

    it('should throw an error if constructorArguments are neither an array nor start with 0x', async function () {
        const args = {
            constructorArgsModule: 'path/to/module',
        };
        const hre = {
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves();
        const extractModuleStub = sinon.stub(utils, 'extractModule').resolves('invalidConstructorArguments');

        try {
            await getConstructorArguments(args, hre as any, runSuperStub as any);
            fail('Expected a ZkSyncVerifyPluginError to be thrown');
        } catch (error: any) {
            console.info(error.message);
            expect(error.message).to.include('Importing the module for the constructor arguments list failed');
        } finally {
            extractModuleStub.restore();
        }
    });

    it('should call runSuper if zksync is false', async function () {
        const args = {};
        const hre = {
            network: {
                zksync: false,
            },
            run: sinon.stub().resolves(),
        };
        const runSuperStub = sinon.stub().resolves();

        await getConstructorArguments(args, hre as any, runSuperStub as any);

        expect(runSuperStub.calledOnce).to.equal(true);
    });

    it('should return constructorArgsParams if constructorArgsModule is not a string', async function () {
        const args = {
            constructorArgsModule: 123,
            constructorArgsParams: [1, 2, 3],
        };
        const hre = {
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves();

        const result = await getConstructorArguments(args, hre as any, runSuperStub as any);

        expect(result).to.deep.equal([1, 2, 3]);
    });

    it('should import constructorArgsModule and return constructorArguments if zksync is true and constructorArgsModule is a string', async function () {
        const args = {
            constructorArgsModule: 'path/to/module',
        };
        const hre = {
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves();
        const importStub = sinon.stub(utils, 'extractModule').resolves('0x1234567890');

        const result = await getConstructorArguments(args, hre as any, runSuperStub as any);

        expect(importStub.calledOnce).to.equal(true);
        expect(importStub.firstCall.args[0]).to.includes('path/to/module');
        expect(result).to.deep.equal('0x1234567890');
    });

    it('should throw an error if importing constructorArgsModule fails', async function () {
        const args = {
            constructorArgsModule: 'path/to/module',
        };
        const hre = {
            network: {
                zksync: true,
            },
        };

        const runSuperStub = sinon.stub().resolves();
        sinon.stub(utils, 'extractModule').throws(new Error('Import error'));

        try {
            await getConstructorArguments(args, hre as any, runSuperStub as any);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.includes('Importing the module for the constructor arguments list failed.');
        }
    });

    it('should throw an error if importing the module fails', async function () {
        const mockPath = 'path/to/constructorArguments';

        const resolvedArgs = { args: [] };
        sinon.stub(utils, 'extractModule').resolves(resolvedArgs);

        const args = await utils.extractModule(mockPath);

        console.info(args);
        assert.equal(args, resolvedArgs, 'Constructor arguments not correct');
    });
});

describe('getContractInfo', async function () {
    afterEach(() => {
        sinon.restore();
    });

    it('should call runSuper if zksync is false', async function () {
        const args = {
            contract: 'Contract',
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };
        const hre = {
            network: {
                zksync: false,
            },
        };
        const runSuperStub = sinon.stub().resolves({});

        await getContractInfo(args, hre as any, runSuperStub as any);

        expect(runSuperStub.calledOnce).to.equal(true);
        expect(runSuperStub.firstCall.args[0]).to.deep.equal(args);
    });

    it('should throw an error if contractFQN is undefined', async function () {
        const args = {
            contract: undefined,
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };
        const hre = {
            artifacts: sinon.stub().resolves({}),
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves({});
        sinon.stub(plugin, 'inferContractArtifacts').throws(new Error('contractFQN is undefined'));

        try {
            await getContractInfo(args, hre as any, runSuperStub as any);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal('contractFQN is undefined');
        }
    });

    it('should throw an error if contractFQN is undefined', async function () {
        const args = {
            contract: 'Greeter',
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };
        const hre = {
            artifacts: { getBuildInfo: () => {} },
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves({});
        sinon.stub(plugin, 'inferContractArtifacts').throws(new Error('contractFQN is undefined'));

        try {
            await getContractInfo(args, hre as any, runSuperStub as any);
        } catch (error: any) {
            expect(error.message.includes("We couldn't find the sources of your Greeter contract in the project."));
        }
    });

    it('should throw an error if no matching contract is found', async function () {
        const args = {
            contract: 'contracts/Contract2.sol:Contract2',
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };
        const hre = {
            artifacts: {
                getAllFullyQualifiedNames: sinon.stub().resolves(['contracts/Contract.sol:Contract']),
                getBuildInfo: sinon.stub().resolves({
                    output: {
                        contracts: {
                            'contracts/Contract.sol': {
                                Contract: {
                                    evm: {
                                        bytecode: {
                                            object: '0x1234567890',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    solcVersion: '0.8.0',
                }),
            },
            network: {
                zksync: true,
            },
        };
        const runSuperStub = sinon.stub().resolves({});
        sinon.stub(bytecode, 'extractMatchingContractInformation').resolves();

        try {
            await getContractInfo(args, hre as any, runSuperStub as any);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal(NO_MATCHING_CONTRACT);
        }
    });

    it('should return contract information if contractFQN is defined and matching contract is found', async function () {
        const args = {
            contract: 'contracts/Contract.sol:Contract',
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };
        const hre = {
            artifacts: {
                getAllFullyQualifiedNames: sinon.stub().resolves(['contracts/Contract.sol:Contract']),
                getBuildInfo: sinon.stub().resolves({
                    output: {
                        contracts: {
                            'contracts/Contract.sol': {
                                Contract: {
                                    evm: {
                                        bytecode: {
                                            object: '0x1234567890',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    solcVersion: '0.8.0',
                }),
            },
            network: {
                zksync: true,
            },
        };

        const contractInformation = {
            contractName: 'Contract',
            sourceName: 'contracts/Contract.sol',
            compilerInput: {
                language: 'Solidity',
                sources: {
                    'contracts/Contract.sol': {
                        content: 'contract Contract {}',
                    },
                },
                settings: {
                    optimizer: {
                        enabled: true,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['evm'],
                        },
                    },
                },
            },
            contractOutput: {
                abi: [],
                metadata: {
                    zk_version: 'v0.1.0',
                    solc_metadata: '0x1234567890',
                    optimizer_settings: '0x1234567890',
                },
                evm: {
                    bytecode: {
                        linkReferences: {},
                        object: '0x1234567890',
                        opcodes: '0x1234567890',
                        sourceMap: '0x1234567890',
                    },
                    deployedBytecode: {
                        linkReferences: {},
                        object: '0x1234567890',
                        opcodes: '0x1234567890',
                        sourceMap: '0x1234567890',
                    },
                    methodIdentifiers: {},
                },
            },
            solcVersion: '0.8.0',
            solcLongVersion: '0.8.0-commit-7222f',
        };

        const runSuperStub = sinon.stub().resolves({});
        const extractMatchingContractInformationStub = sinon
            .stub(bytecode, 'extractMatchingContractInformation')
            .resolves(contractInformation);

        const result = await getContractInfo(args, hre as any, runSuperStub as any);

        expect(result).to.deep.equal(contractInformation);
        expect(runSuperStub.called).to.equal(false);
        expect(extractMatchingContractInformationStub.calledOnce).to.equal(true);
        expect(extractMatchingContractInformationStub.firstCall.args[0]).to.equal('contracts/Contract.sol');
        expect(extractMatchingContractInformationStub.firstCall.args[1]).to.equal('Contract');
        expect(extractMatchingContractInformationStub.firstCall.args[3]).to.equal(args.deployedBytecode);
    });

    it('should return contract information if contractFQN is undefined and matching contract is found', async function () {
        const args = {
            contractFQN: undefined,
            deployedBytecode: '0x1234567890',
            matchingCompilerVersions: [],
            libraries: {},
        };

        const hre = {
            artifacts: {
                getAllFullyQualifiedNames: sinon.stub().resolves(['contracts/Contract.sol:Contract']),
                getBuildInfo: sinon.stub().resolves({
                    output: {
                        contracts: {
                            'contracts/Contract.sol': {
                                Contract: {
                                    evm: {
                                        bytecode: {
                                            object: '0x1234567890',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    solcVersion: '0.8.0',
                }),
            },
            network: {
                zksync: true,
            },
        };

        const contractInformation = {
            contractName: 'Contract',
            sourceName: 'contracts/Contract.sol',
            compilerInput: {
                language: 'Solidity',
                sources: {
                    'contracts/Contract.sol': {
                        content: 'contract Contract {}',
                    },
                },
                settings: {
                    optimizer: {
                        enabled: true,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['evm'],
                        },
                    },
                },
            },
            contractOutput: {
                abi: [],
                metadata: {
                    zk_version: '0.1.0',
                    solc_metadata: '0x1234567890',
                    optimizer_settings: '0x1234567890',
                },
                evm: {
                    bytecode: {
                        linkReferences: {},
                        object: '0x1234567890',
                        opcodes: '0x1234567890',
                        sourceMap: '0x1234567890',
                    },
                    deployedBytecode: {
                        linkReferences: {},
                        object: '0x1234567890',
                        opcodes: '0x1234567890',
                        sourceMap: '0x1234567890',
                    },
                    methodIdentifiers: {},
                },
            },
            solcVersion: '0.8.0',
        };
        const runSuperStub = sinon.stub().resolves({});
        const inferContractArtifactsStub = sinon.stub(plugin, 'inferContractArtifacts').resolves(contractInformation);

        const result = await getContractInfo(args, hre as any, runSuperStub as any);

        expect(result).to.deep.equal(contractInformation);
        expect(runSuperStub.called).to.equal(false);
        expect(hre.artifacts.getBuildInfo.called).to.equal(false);
        expect(inferContractArtifactsStub.calledOnce).to.equal(true);
        expect(inferContractArtifactsStub.firstCall.args[0]).to.equal(hre.artifacts);
        expect(inferContractArtifactsStub.firstCall.args[1]).to.equal(args.matchingCompilerVersions);
        expect(inferContractArtifactsStub.firstCall.args[2]).to.equal(args.deployedBytecode);
    });
});
