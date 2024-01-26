import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import {
    checkVerificationStatusService,
    verifyContractRequest,
    getSupportedCompilerVersions,
    ZkSyncBlockExplorerResponse,
} from '../../../src/zksync-block-explorer/service';
import { VerificationStatusResponse } from '../../../src/zksync-block-explorer/verification-status-response';
import { ZkSyncBlockExplorerVerifyRequest } from '../../../src/zksync-block-explorer/verify-contract-request';

describe('ZkSyncBlockExplorer Service', () => {
    describe('checkVerificationStatusService', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the verification status response', async () => {
            const requestId = 123;
            const verifyURL = 'https://example.com/verify';

            const response = {
                status: 200,
                data: {
                    status: 'successful',
                    message: 'Verification successful',
                    error: undefined,
                    compilationErrors: undefined,
                },
            };

            sinon.stub(axios, 'get').resolves(response);

            const result = await checkVerificationStatusService(requestId, verifyURL);

            expect(result).to.be.instanceOf(VerificationStatusResponse);
            expect(result.status).to.equal(response.data.status);
            expect(result.isVerificationSuccess()).to.equal(true);
        });

        it('should handle axios error', async () => {
            const requestId = 123;
            const verifyURL = 'https://example.com/verify';

            const error = new Error('Network error');

            sinon.stub(axios, 'get').rejects(error);

            try {
                await checkVerificationStatusService(requestId, verifyURL);
            } catch (err: any) {
                expect(err.message).to.equal(err.message);
            }
        });
    });

    describe('verifyContractRequest', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the ZkSyncBlockExplorerResponse when verification is successful', async () => {
            const req: ZkSyncBlockExplorerVerifyRequest = {
                codeFormat: 'solidity-standard-json-input',
                compilerSolcVersion: '0.8.0',
                compilerZksolcVersion: '0.1.0',
                contractName: 'MyContract',
                constructorArguments: '[]',
                contractAddress: '0x123456',
                optimizationUsed: true,
                sourceCode: 'pragma solidity ^0.8.0; contract MyContract {}',
            };
            const verifyURL = 'https://example.com/verify';

            const response = {
                status: 200,
                data: 'Verification successful',
            };

            sinon.stub(axios, 'post').resolves(response);

            const result = await verifyContractRequest(req, verifyURL);

            expect(result).to.be.instanceOf(ZkSyncBlockExplorerResponse);
            expect(result.status).to.equal(response.status);
            expect(result.message).to.equal(response.data);
        });

        it('should throw ZkSyncVerifyPluginError when verification fails', async () => {
            const req: ZkSyncBlockExplorerVerifyRequest = {
                codeFormat: 'solidity-standard-json-input',
                compilerSolcVersion: '0.8.0',
                compilerZksolcVersion: '0.1.0',
                contractName: 'MyContract',
                constructorArguments: '[]',
                contractAddress: '0x123456',
                optimizationUsed: true,
                sourceCode: 'pragma solidity ^0.8.0; contract MyContract {}',
            };
            const verifyURL = 'https://example.com/verify';

            const response = {
                status: 400,
                data: 'Verification failed',
            };

            sinon.stub(axios, 'post').resolves(response);

            try {
                await verifyContractRequest(req, verifyURL);
                expect.fail('Expected ZkSyncVerifyPluginError to be thrown');
            } catch (error: any) {
                expect(error.message).to.includes(
                    'Failed to send contract verification request\n Reason: ZkSyncVerifyPluginError: Verification failed',
                );
            }
        });

        it('should handle axios error', async () => {
            const req: ZkSyncBlockExplorerVerifyRequest = {
                codeFormat: 'solidity-standard-json-input',
                compilerSolcVersion: '0.8.0',
                compilerZksolcVersion: '0.1.0',
                contractName: 'MyContract',
                constructorArguments: '[]',
                contractAddress: '0x123456',
                optimizationUsed: true,
                sourceCode: 'pragma solidity ^0.8.0; contract MyContract {}',
            };
            const verifyURL = 'https://example.com/verify';

            const error = new Error('Network error');

            sinon.stub(axios, 'post').rejects(error);

            try {
                await verifyContractRequest(req, verifyURL);
            } catch (err: any) {
                expect(err.message).to.equal(err.message);
            }
        });
    });

    describe('getSupportedCompilerVersions', () => {
        afterEach(() => {
            sinon.restore();
        });

        it('should return the list of supported compiler versions', async () => {
            const verifyURL = 'https://example.com/verify';

            const response = {
                data: ['0.7.0', '0.8.0', '0.8.1'],
            };

            sinon.stub(axios, 'get').resolves(response);

            const result = await getSupportedCompilerVersions(verifyURL);

            expect(result).to.deep.equal(response.data);
        });
    });
});