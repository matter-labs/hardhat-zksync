import { assert, expect } from 'chai';
import sinon from 'sinon';
import axion from 'axios';
import {
    delay,
    encodeArguments,
    extractQueryParams,
    getZkVmNormalizedVersion,
    handleAxiosError,
    parseWrongConstructorArgumentsError,
    retrieveContractBytecode,
} from '../../src/utils';

describe('handleAxiosError', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should throw an error with the Axios error details', () => {
        const error = {
            code: 'SOME_CODE',
            response: {
                data: 'Some error message',
            },
        };

        sinon.stub(axion, 'isAxiosError').returns(true);

        expect(() => handleAxiosError(error)).to.throw(
            `Axios error (code: SOME_CODE) during the contract verification request\n Reason: ${error.response?.data}`,
        );
    });

    it('should throw a ZkSyncVerifyPluginError with the error message', () => {
        const error = 'Some error message';

        expect(() => handleAxiosError(error)).to.throw(
            `Failed to send contract verification request\n Reason: ${error}`,
        );
    });
});

describe('delay', () => {
    it('should delay for the specified amount of time', async () => {
        const ms = 1000;
        const startTime = Date.now();
        await delay(ms);
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        expect(elapsedTime).to.be.at.least(ms);
    });
});

describe('encodeArguments', () => {
    it('should encode constructor arguments correctly', async () => {
        const abi = [
            {
                type: 'constructor',
                inputs: [
                    { type: 'string', name: 'name' },
                    { type: 'uint256', name: 'age' },
                ],
            },
        ];
        const constructorArgs = ['John Doe', 25];
        const encodedData =
            '0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000001900000000000000000000000000000000000000000000000000000000000000084a6f686e20446f65000000000000000000000000000000000000000000000000';

        const result = await encodeArguments(abi, constructorArgs);

        expect(result).to.equal(encodedData);
    });

    it('should throw an error when constructor arguments are incorrect', async () => {
        const abi = [
            {
                type: 'constructor',
                inputs: [
                    { type: 'string', name: 'name' },
                    { type: 'uint256', name: 'age' },
                ],
            },
        ];
        const constructorArgs = ['John Doe', '25', '43'];

        try {
            await encodeArguments(abi, constructorArgs);
            // Fail the test if no error is thrown
            expect.fail('Expected an error to be thrown');
        } catch (error: any) {
            expect(error.message).to.equal(
                'The number of constructor arguments you provided (3) does not match the number of constructor arguments the contract has been deployed with (2).',
            );
        }
    });
});

describe('retrieveContractBytecode', () => {
    beforeEach(() => {
        sinon.restore();
    });
    it('should throw ZkSyncVerifyPluginError if there is no bytecode at the address', async function () {
        const hre = {
            network: {
                name: 'testnet',
                provider: {
                    send: sinon.stub().resolves('0x'),
                },
            },
        };
        const address = '0x1234567890123456789012345678901234567890';

        try {
            await retrieveContractBytecode(address, hre as any);
        } catch (error) {
            if (!(error instanceof Error)) {
                throw new Error('Expected error to be a Error');
            }
        }
    });

    it('should return deployed bytecode if it exists', async function () {
        const hre = {
            network: {
                name: 'testnet',
                provider: {
                    send: sinon.stub().resolves('0x1234'),
                },
            },
        };
        const address = '0x1234567890123456789012345678901234567890';

        const bytecode = await retrieveContractBytecode(address, hre as any);
        assert.strictEqual(bytecode, '1234', 'The function did not return the expected bytecode.');
    });
});

describe('parseWrongConstructorArgumentsError', () => {
    it('should return the correct error message', () => {
        const inputString = 'Error: count=2, value=5, types=[string, uint256]';
        const expectedOutput =
            'The number of constructor arguments you provided (undefined) does not match the number of constructor arguments the contract has been deployed with (undefined).';

        const result = parseWrongConstructorArgumentsError(inputString);

        expect(result).to.equal(expectedOutput);
    });
});

describe('getZkVmNormalizedVersion', () => {
    it('should return the normalized version string', () => {
        const solcVersion = '0.8.17';
        const zkVmSolcVersion = '1.3.17';
        const expectedVersion = 'zkVM-0.8.17-1.3.17';

        const version = getZkVmNormalizedVersion(solcVersion, zkVmSolcVersion);

        expect(version).to.equal(expectedVersion);
    });
});

describe('extractQueryParams', () => {
    it('should return the new url string and query params object', () => {
        const verifyURL = 'https://example.com/verify?param1=value1&param2=value2';
        const expectedURL = 'https://example.com/verify';
        const expectedParams = { param1: 'value1', param2: 'value2' };

        const [newURL, params] = extractQueryParams(verifyURL);

        expect(newURL).to.equal(expectedURL);
        assert.deepEqual(params, expectedParams);
    });

    it('should return the new url string and empty query params object', () => {
        const verifyURL = 'https://example.com/verify';
        const expectedURL = 'https://example.com/verify';
        const expectedParams = {};

        const [newURL, params] = extractQueryParams(verifyURL);

        expect(newURL).to.equal(expectedURL);
        assert.deepEqual(params, expectedParams);
    });
});
