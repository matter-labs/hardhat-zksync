import { expect } from 'chai';
import sinon from 'sinon';
import { fail } from 'assert';
import { TASK_COMPILE, TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH } from 'hardhat/builtin-tasks/task-names';
import {
    getCompilerVersions,
    getConstructorArguments,
    getContractInfo,
    verify,
    verifyContract,
} from '../../src/task-actions';
import {
    NO_MATCHING_CONTRACT,
    NO_VERIFIABLE_ADDRESS_ERROR,
    TASK_CHECK_VERIFICATION_STATUS,
    TASK_VERIFY_GET_COMPILER_VERSIONS,
    TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS,
    TASK_VERIFY_GET_CONTRACT_INFORMATION,
    TASK_VERIFY_VERIFY,
} from '../../src/constants';
import * as utils from '../../src/utils';
import * as metadata from '../../src/solc/metadata';
import * as service from '../../src/zksync-block-explorer/service';
import * as plugin from '../../src/plugin';
import * as bytecode from '../../src/solc/bytecode';

describe('verifyContract', async function () {
    it('should call runSuper if zksync is false', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: false,
            },
            run: sinon.stub(),
        };

        await verifyContract({}, hre as any, runSuperStub as any);
        expect(runSuperStub.calledOnce).to.equal(true);
    });

    it('should throw an error if the address is invalid', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: true,
            },
            run: sinon.stub(),
        };

        try {
            await verifyContract({ address: 'invalid_address' }, hre as any, runSuperStub as any);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal('invalid_address is an invalid address.');
        }
    });

    it('should call runSuper if zksync is false', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: false,
            },
            run: sinon.stub(),
        };

        await verifyContract({}, hre as any, runSuperStub as any);
        expect(runSuperStub.calledOnce).to.equal(true);
    });

    it('should throw an error if the address is invalid', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: true,
            },
            run: sinon.stub(),
        };

        try {
            await verifyContract({ address: 'invalid_address' }, hre as any, runSuperStub as any);
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal('invalid_address is an invalid address.');
        }
    });

    it('should call run with the correct arguments if zksync is true and address is valid', async function () {
        sinon.stub(utils, 'retrieveContractBytecode').resolves('0x1234567890');
        sinon.stub(metadata, 'inferSolcVersion').resolves('0.8.0');
        sinon.stub(service, 'getSupportedCompilerVersions').resolves(['0.8.0']);
        sinon.stub(plugin, 'getSolidityStandardJsonInput').resolves({
            language: 'Solidity',
            sources: {
                'contracts/Contract.sol': {
                    content: 'contract Contract {}',
                },
            },
        });
        sinon.stub(service, 'verifyContractRequest').resolves({
            status: 200,
            message: '1',
            isOk: () => true,
        });

        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                config: {
                    url: 'http://localhost:3000',
                },
                zksync: true,
                verifyURL: 'http://localhost:3000/verify',
            },
            run: sinon
                .stub()
                .onThirdCall()
                .resolves({
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
                })
                .onCall(3)
                .resolves({
                    getResolvedFiles: sinon.stub().resolves(),
                }),
        };

        const args = {
            address: '0x1234567890123456789012345678901234567890',
            constructorArguments: [],
            contract: 'contract',
            libraries: 'libraries',
            noCompile: false,
        };

        await verifyContract(args, hre as any, runSuperStub as any);
        expect(runSuperStub.calledOnce).to.equal(false);
        expect(hre.run.firstCall.args[0]).to.equal(TASK_VERIFY_GET_COMPILER_VERSIONS);
        expect(hre.run.secondCall.args[0]).to.equal(TASK_COMPILE);
        expect(hre.run.thirdCall.args[0]).to.equal(TASK_VERIFY_GET_CONTRACT_INFORMATION);
        expect(hre.run.getCall(3).args[0]).to.equal(TASK_COMPILE_SOLIDITY_GET_DEPENDENCY_GRAPH);
        expect(hre.run.getCall(4).args[0]).to.equal(TASK_CHECK_VERIFICATION_STATUS);
    });
});
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
        expect(result).to.deep.equal(['0.8.0', '0.7.0', '0.6.0']);
        expect(runSuperStub.called).to.equal(false);
    });
});

describe('verify', async function () {
    afterEach(() => {
        sinon.restore();
    });

    it('should call runSuper if zksync is false', async function () {
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
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

    it('should throw an error if address is undefined', async function () {
        sinon.stub(plugin, 'getLibraries').resolves({});
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: true,
                verifyURL: 'http://localhost:3000/verify',
            },
            run: sinon.stub().resolves({}),
        };

        try {
            await verify(
                {
                    address: undefined as any,
                    constructorArgs: '',
                    contract: '',
                    constructorArgsParams: [],
                    libraries: '',
                    noCompile: false,
                },
                hre as any,
                runSuperStub as any,
            );
            fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal(NO_VERIFIABLE_ADDRESS_ERROR);
        }
    });

    it('should call run with the correct arguments', async function () {
        sinon.stub(plugin, 'getLibraries').resolves({});
        const runSuperStub = sinon.stub().resolves(0);
        const hre = {
            network: {
                zksync: true,
                verifyURL: 'http://localhost:3000/verify',
            },
            run: sinon.stub().resolves({}),
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
        expect(hre.run.firstCall.args[0]).to.equal(TASK_VERIFY_GET_CONSTRUCTOR_ARGUMENTS);
        expect(hre.run.secondCall.args[0]).to.equal(TASK_VERIFY_VERIFY);
        expect(hre.run.secondCall.args[1]).to.deep.equal({
            address: '0x1234567890',
            constructorArguments: {},
            contract: 'Contract',
            libraries: {},
            noCompile: false,
        });
    });
});
describe('getConstructorArguments', async function () {
    afterEach(() => {
        sinon.restore();
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
});

describe('getContractInfo', async function () {
    afterEach(() => {
        sinon.restore();
    });

    it('should call runSuper if zksync is false', async function () {
        const args = {
            contractFQN: 'Contract',
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
            contractFQN: undefined,
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

    it('should throw an error if no matching contract is found', async function () {
        const args = {
            contractFQN: 'contracts/Contract2.sol:Contract2',
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
            contractFQN: 'contracts/Contract.sol:Contract',
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
