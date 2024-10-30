import { expect } from 'chai';
import sinon, { SinonSandbox } from 'sinon';
import axios from 'axios';
import { ChainConfig } from '@nomicfoundation/hardhat-verify/types';
import { EthereumProvider } from 'hardhat/types';
import assert from 'assert';
import * as metadata from '../../../src/solc/metadata';
import * as utils from '../../../src/utils';
import { ZkSyncEtherscanExplorerService } from '../../../src/explorers/zksync-etherscan/service';
import { ZksyncEtherscanResponse } from '../../../src/explorers/zksync-etherscan/verification-status-response';

describe('ZkSyncEtherscan Service', () => {
    describe('fromChainConfig', () => {
        let hre: any;
        let chainConfig: ChainConfig;
        beforeEach(() => {
            hre = {};
            chainConfig = {
                network: 'sepolia',
                chainId: 300,
                urls: {
                    apiURL: 'https://api.example.com',
                    browserURL: 'https://browser.example.com',
                },
            };
        });

        it('should create an instance of ZkSyncEtherscan with valid config', async () => {
            const service = await ZkSyncEtherscanExplorerService.fromChainConfig(hre, 'api', chainConfig);
            expect(service).instanceOf(ZkSyncEtherscanExplorerService);
        });
    });

    describe('getCurrentChainConfig', () => {
        const customChains: ChainConfig[] = [
            {
                network: 'customChain1',
                chainId: 5000,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
            {
                network: 'customChain2',
                chainId: 5000,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
            {
                network: 'customChain3',
                chainId: 4999,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
        ];

        const defaultChains: ChainConfig[] = [
            {
                network: 'defaultChains1',
                chainId: 300,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
            {
                network: 'defaultChains2',
                chainId: 260,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
            {
                network: 'defaultChains3',
                chainId: 250,
                urls: {
                    apiURL: '<api-url>',
                    browserURL: '<browser-url>',
                },
            },
        ];

        it('should return the last matching custom chain defined by the user', async function () {
            const networkName = 'customChain2';
            const ethereumProvider = {
                async send() {
                    return (5000).toString(16);
                },
            } as unknown as EthereumProvider;

            const currentChainConfig = await ZkSyncEtherscanExplorerService.getCurrentChainConfig(
                ethereumProvider,
                customChains,
                defaultChains,
            );

            assert.equal(currentChainConfig.network, networkName);
            assert.equal(currentChainConfig.chainId, 5000);
        });

        it('should return a built-in chain if no custom chain matches', async function () {
            const networkName = 'defaultChains2';
            const ethereumProvider = {
                async send() {
                    return (260).toString(16);
                },
            } as unknown as EthereumProvider;
            const currentChainConfig = await ZkSyncEtherscanExplorerService.getCurrentChainConfig(
                ethereumProvider,
                customChains,
                defaultChains,
            );

            assert.equal(currentChainConfig.network, networkName);
            assert.equal(currentChainConfig.chainId, 260);
        });

        it('should return hardhat if the selected network is hardhat and it was added as a custom chain', async () => {
            const networkName = 'hardhat';
            const ethereumProvider = {
                async send() {
                    return (31337).toString(16);
                },
            } as unknown as EthereumProvider;

            const currentChainConfig = await ZkSyncEtherscanExplorerService.getCurrentChainConfig(
                ethereumProvider,
                [
                    ...customChains,
                    {
                        network: 'hardhat',
                        chainId: 31337,
                        urls: {
                            apiURL: '<api-url>',
                            browserURL: '<browser-url>',
                        },
                    },
                ],
                defaultChains,
            );

            assert.equal(currentChainConfig.network, networkName);
            assert.equal(currentChainConfig.chainId, 31337);
        });

        it('should throw if there are no matches at all', async () => {
            const ethereumProvider = {
                async send() {
                    return (21343214123).toString(16);
                },
            } as unknown as EthereumProvider;

            try {
                await ZkSyncEtherscanExplorerService.getCurrentChainConfig(
                    ethereumProvider,
                    customChains,
                    defaultChains,
                );
            } catch (e: any) {
                expect(e.message).to.contains('The provided chain with id 21343214123 is not supported by default!');
            }
        });
    });

    describe('checkVerificationStatusService', () => {
        const sandbox: SinonSandbox = sinon.createSandbox();
        afterEach(() => {
            sandbox.restore();
        });

        it('should return the verification status response', async () => {
            const requestId = '123';
            const explorer = new ZkSyncEtherscanExplorerService(
                {} as any,
                'https://example.com/verify',
                'https://example.com/',
            );
            const response = {
                status: 200,
                data: {
                    status: 1,
                    result: 'Pass - Verified',
                },
            };

            sandbox.stub(axios, 'get').resolves(response);
            const result = await explorer.getVerificationStatus(requestId, {
                contractAddress: '0x0000000000000001',
                contractName: 'contracts/Example.sol:Example',
            });

            expect(!result.errorExists());
            expect(result).to.be.instanceOf(ZksyncEtherscanResponse);
            expect(result.status).to.equal(response.data.status);
            expect(result.isSuccess()).to.equal(true);
        });

        it('should return the error', async () => {
            const requestId = '123';
            const explorer = new ZkSyncEtherscanExplorerService(
                {} as any,
                'https://example.com/verify',
                'https://example.com/',
            );
            const response = {
                status: 400,
                data: {
                    status: 'failed',
                    message: 'Verification unsuccessful',
                    error: 'already verified',
                    compilationErrors: ['has compilation errors'],
                },
            };

            sandbox.stub(axios, 'get').resolves(response);

            try {
                await explorer.getVerificationStatus(requestId, {
                    contractAddress: '0x0000000000000001',
                    contractName: 'contracts/Example.sol:Example',
                });
            } catch (error: any) {
                expect(error.message).to.contains(`Failed to send contract verification request`);
            }
        });

        it('should handle axios error', async () => {
            const requestId = '123';
            const explorer = new ZkSyncEtherscanExplorerService(
                {} as any,
                'https://example.com/verify',
                'https://example.com/',
            );
            const error = new Error('Network error');

            sandbox.stub(axios, 'get').rejects(error);

            try {
                await explorer.getVerificationStatus(requestId, {
                    contractAddress: '0x0000000000000001',
                    contractName: 'contracts/Example.sol:Example',
                });
            } catch (err: any) {
                expect(err.message).to.equal(err.message);
            }
        });
    });

    describe('verifyContractRequest', () => {
        const sandbox: SinonSandbox = sinon.createSandbox();
        beforeEach(() => {
            sandbox.stub(utils, 'retrieveContractBytecode').resolves('0x1234567890');
            sandbox.stub(metadata, 'inferSolcVersion').resolves('0.8.0');
        });
        afterEach(() => {
            sandbox.restore();
        });

        it('should return the ZkSyncEtherscan when verification is successful', async () => {
            sandbox.stub(axios, 'post').resolves({
                status: 200,
                data: {
                    status: '1',
                    message: 'OK',
                    result: '24444',
                },
            });

            sandbox.stub().resolves(0);
            const hre = {
                config: {
                    paths: {
                        sources: 'contracts',
                        root: 'root',
                    },
                    zksolc: {
                        version: '1.5.4',
                        settings: {
                            contractsToCompile: [],
                        },
                    },
                },
                network: {
                    config: {
                        url: 'http://localhost:3000',
                    },
                    zksync: true,
                    verifyURL: 'http://localhost:3000/verify',
                },
                run: sandbox
                    .stub()
                    .onSecondCall()
                    .resolves(['0.8.0'])
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
                        solcLongVersion: '0.8.0',
                    })
                    .onCall(3)
                    .resolves(['0.8.0'])
                    .onCall(4)
                    .resolves({
                        getResolvedFiles: sandbox.stub().resolves([
                            {
                                sourceName: 'contracts/Contract.sol',
                                content: {
                                    rawContent: 'contract Contract {}',
                                },
                            },
                        ]),
                    }),
            };
            const explorer = new ZkSyncEtherscanExplorerService(
                hre as any,
                'https://example.com/verify',
                'https://example.com/',
            );

            const result = await explorer.verify(
                '0x275a050Fd05883dbB572D76F8B5E53A892b370AD',
                'contracts/Contract.sol',
                [],
                {},
                false,
            );

            expect(result.verificationId).to.equal('24444');
            expect(result.contractVerifyDataInfo.contractAddress).to.equal(
                '0x275a050Fd05883dbB572D76F8B5E53A892b370AD',
            );
            expect(result.contractVerifyDataInfo.contractName).to.equal('contracts/Contract.sol:Contract');
        });

        it('should throw the error when verification is unsuccessful', async () => {
            sandbox.stub(axios, 'post').resolves({
                status: 200,
                data: {
                    status: '0',
                    message: 'NOTOK',
                    result: 'Error!',
                },
            });

            sandbox.stub().resolves(0);
            const hre = {
                config: {
                    paths: {
                        sources: 'contracts',
                        root: 'root',
                    },
                    zksolc: {
                        version: '1.5.4',
                        settings: {
                            contractsToCompile: [],
                        },
                    },
                },
                network: {
                    config: {
                        url: 'http://localhost:3000',
                    },
                    zksync: true,
                    verifyURL: 'http://localhost:3000/verify',
                },
                run: sandbox
                    .stub()
                    .onSecondCall()
                    .resolves(['0.8.0'])
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
                        solcLongVersion: '0.8.0',
                    })
                    .onCall(3)
                    .resolves(['0.8.0'])
                    .onCall(4)
                    .resolves({
                        getResolvedFiles: sandbox.stub().resolves([
                            {
                                sourceName: 'contracts/Contract.sol',
                                content: {
                                    rawContent: 'contract Contract {}',
                                },
                            },
                        ]),
                    }),
            };
            const explorer = new ZkSyncEtherscanExplorerService(
                hre as any,
                'https://example.com/verify',
                'https://example.com/',
            );

            try {
                await explorer.verify(
                    '0x275a050Fd05883dbB572D76F8B5E53A892b370AD',
                    'contracts/Contract.sol',
                    [],
                    {},
                    false,
                );
            } catch (e: any) {
                console.log(e.message);
                expect(e.message).to.contains('Reason: ZkSyncVerifyPluginError: Error!');
            }
        });
    });
});
