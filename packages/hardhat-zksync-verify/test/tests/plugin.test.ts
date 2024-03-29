import { expect } from 'chai';
import sinon from 'sinon';
import { Artifacts, ResolvedFile } from 'hardhat/types';
import { fail } from 'assert';
import path from 'path';
import {
    checkContractName,
    checkVerificationStatus,
    flattenContractFile,
    getLibraries,
    getSolidityStandardJsonInput,
    inferContractArtifacts,
} from '../../src/plugin';
import { Bytecode } from '../../src/solc/bytecode';
import * as bytecodes from '../../src/solc/bytecode';
import { useEnvironment } from '../helpers';
import { CONTRACT_NAME_NOT_FOUND, NO_MATCHING_CONTRACT } from '../../src/constants';
import { ContractInformation } from '../../src/solc/types';
import { VerificationStatusResponse } from '../../src/zksync-block-explorer/verification-status-response';

describe('Plugin', () => {
    const artifacts: Artifacts = {
        readArtifact: sinon.stub().resolves({}),
        readArtifactSync: sinon.stub().returns({}),
        artifactExists: sinon.stub().resolves(true),
        getAllFullyQualifiedNames: sinon.stub().resolves([]),
        getBuildInfo: sinon.stub().resolves({ solcVersion: '0.8.0' }),
        getBuildInfoSync: sinon.stub().returns({ solcVersion: '0.8.0' }),
        getArtifactPaths: sinon.stub().resolves([]),
        getDebugFilePaths: sinon.stub().resolves([]),
        getBuildInfoPaths: sinon.stub().resolves([]),
        saveArtifactAndDebugFile: sinon.stub().resolves(),
        saveBuildInfo: sinon.stub().resolves(),
        formArtifactPathFromFullyQualifiedName: sinon.stub().returns(''),
    };

    beforeEach(() => {
        sinon.restore();
    });

    function extractMatchingContractInformation(contractInformation: any): Promise<ContractInformation> {
        return contractInformation;
    }

    const bytecode: Bytecode = new Bytecode('0x1234567890');

    describe('inferContractArtifacts', () => {
        it('should throw ZkSyncVerifyPluginError when no matching contract is found', async () => {
            sinon.stub(bytecodes, 'extractMatchingContractInformation').returns(
                extractMatchingContractInformation({
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
                }),
            );

            expect(!bytecode.hasMetadata());
            expect(bytecode.getInferredSolcVersion() !== undefined);

            try {
                await inferContractArtifacts(artifacts, [], bytecode);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(NO_MATCHING_CONTRACT);
            }
        });
        it('should return the contract information when a matching contract is found', async () => {
            sinon.stub(bytecodes, 'extractMatchingContractInformation').returns(
                extractMatchingContractInformation({
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
                }),
            );

            artifacts.getAllFullyQualifiedNames = sinon.stub().resolves(['contracts/Contract.sol:Contract']);

            const matchingCompilerVersions = ['0.8.0'];

            const contractInformation: ContractInformation = await inferContractArtifacts(
                artifacts,
                matchingCompilerVersions,
                bytecode,
            );

            expect(contractInformation.contractName).to.equal('Contract');
            expect(contractInformation.sourceName).to.equal('contracts/Contract.sol');
            expect(contractInformation.contractOutput.evm.bytecode.object).to.equal('0x1234567890');
        });
    });

    describe('flattenContractFile', async function () {
        useEnvironment('localGreeter');

        it('should return the flattened source code', async function () {
            const filePath = 'contracts/Contract.sol';

            const flattenedSourceCode = await flattenContractFile(this.env, filePath);

            expect(flattenedSourceCode).to.includes('contract Contract {');
        });
    });

    describe('checkContractName', async function () {
        it('should throw ZkSyncVerifyPluginError when contractFQN is undefined', async function () {
            const contractFQN = undefined as any;

            try {
                await checkContractName(artifacts, contractFQN);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(CONTRACT_NAME_NOT_FOUND);
            }
        });

        it('should throw ZkSyncVerifyPluginError when contractFQN is not a valid fully qualified name', async function () {
            artifacts.artifactExists = sinon.stub().resolves(false);
            artifacts.getAllFullyQualifiedNames = sinon.stub().resolves(['contracts/Contract.sol:Contract']);
            const contractFQN = 'invalid_contract_name';

            try {
                await checkContractName(artifacts, contractFQN);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to
                    .equal(`A valid fully qualified name was expected. Fully qualified names look like this: "contracts/AContract.sol:TheContract"
Instead, this name was received: ${contractFQN}`);
            }
        });

        it('should throw ZkSyncVerifyPluginError when the contract does not exist', async function () {
            artifacts.artifactExists = sinon.stub().resolves(false);
            const contractFQN = 'contracts/Contract.sol:Contract';

            try {
                await checkContractName(artifacts, contractFQN);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(
                    'The contract contracts/Contract.sol:Contract is not present in your project.',
                );
            }
        });

        it('should not throw an error when the contract exists', async function () {
            artifacts.artifactExists = sinon.stub().resolves(true);
            const contractFQN = 'contracts/Contract.sol:Contract';

            try {
                await checkContractName(artifacts, contractFQN);
            } catch (error: any) {
                fail('Expected no error to be thrown');
            }
        });
    });

    describe('getSolidityStandardJsonInput', async function () {
        useEnvironment('localGreeter');
        it('should return the Solidity standard JSON input', async function () {
            const hre = {
                config: {
                    zksolc: {
                        settings: {
                            isSystem: true,
                        },
                    },
                },
            };

            const resolvedFiles: ResolvedFile[] = [
                {
                    sourceName: 'contracts/Contract.sol',
                    absolutePath: 'contracts/Contract.sol',
                    lastModificationDate: new Date(),
                    contentHash: '0x1234567890',
                    getVersionedName: () => 'contracts/Contract.sol',
                    content: {
                        rawContent: 'contract Contract {}',
                        imports: [],
                        versionPragmas: ['0.8.0'],
                    },
                },
            ];

            const solidityStandardJsonInput = getSolidityStandardJsonInput(hre as any, resolvedFiles, {
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
            });

            expect(solidityStandardJsonInput.language).to.equal('Solidity');
            expect(solidityStandardJsonInput.sources['contracts/Contract.sol'].content).to.equal(
                'contract Contract {}',
            );
            expect(solidityStandardJsonInput.settings.optimizer.enabled).to.equal(true);
            expect(solidityStandardJsonInput.settings.isSystem).to.equal(true);
            expect(solidityStandardJsonInput.settings.forceEvmla).to.equal(false);
        });
    });

    describe('getLibraries', async function () {
        it('should throw ZkSyncVerifyPluginError when importing the libraries module fails', async function () {
            const librariesModule = '../args.js';

            try {
                await getLibraries(librariesModule);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.includes(
                    `Importing the module for the libraries dictionary failed. Reason: Cannot find module '${path.resolve(
                        process.cwd(),
                        librariesModule,
                    )}'`,
                );
            }
        });

        it('should throw ZkSyncVerifyPluginError when importing the libraries module fails', async function () {
            const librariesModule = '../wrongArgs.js';

            try {
                await getLibraries(librariesModule);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.includes(
                    `Importing the module for the libraries dictionary failed. Reason: Cannot find module '${path.resolve(
                        process.cwd(),
                        librariesModule,
                    )}'`,
                );
            }
        });

        it('should return the libraries object when importing the libraries module succeeds', async function () {
            const librariesModule = '../localGreeter/args.js';

            const libraries = await getLibraries(librariesModule);

            expect(libraries).to.deep.equal({
                name: 'localGreeter',
            });
        });
    });

    describe('checkVerificationStatus', async function () {
        useEnvironment('localGreeter');

        it('should throw ZkSyncVerifyPluginError when backend verification error exists', async function () {
            sinon.stub(VerificationStatusResponse.prototype, 'errorExists').returns(true);

            const args = {
                verificationId: 123,
            };

            try {
                await checkVerificationStatus(args, this.env);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(
                    'Backend verification error: Deployed bytecode is not equal to generated one from given source',
                );
            }
        });

        it.skip('should log a success message and return true when verification is successful', async function () {
            sinon.stub(VerificationStatusResponse.prototype, 'errorExists').returns(false);

            const args = {
                verificationId: 123,
            };

            const consoleInfoSpy = sinon.spy(console, 'info');
            const result = await checkVerificationStatus(args, this.env);

            sinon.assert.calledWith(
                consoleInfoSpy,
                '\u001b[32mContract successfully verified on zkSync block explorer!\u001b[39m',
            );
            expect(result).to.equal(true);
        });
    });

    describe('normalizeBytecode', () => {
        it('should not modify bytecode when it does not start with the expected placeholder', async () => {
            const mockBytecode = 'abcdef1234567890';
            const symbols = {
                object: '73',
            };

            const result = await bytecodes.normalizeBytecode(mockBytecode, symbols as any);

            expect(result.normalizedBytecode).to.equal(mockBytecode);
        });
    });
});
