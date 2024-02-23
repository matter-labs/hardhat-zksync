import { expect } from 'chai';
import * as zk from 'zksync-ethers';
import { decodeReturnData, getReturnDataFromError } from '../../src/internal/reverted/utils';
import { assertIsNotNull } from '../../src/internal/utils';
import { getAddressOf, isWalletOrContract } from '../../src/internal/misc/account';

class TestError extends Error {
    public data?: any;

    constructor(message: string, data?: any) {
        super(message);
        this.data = data;
    }
}

describe('Miscellaneous tests', function () {
    it('fails to decode return data', async function () {
        try {
            const ERROR_STRING_PREFIX = '0x08c379a0';
            const malformedReturnData = `${ERROR_STRING_PREFIX}ThisIsNotValidEncodedData`;
            decodeReturnData(malformedReturnData);
        } catch (e: any) {
            expect(e.message.includes('There was an error decoding'), 'Should have fail to decode return data');
        }
    });

    it('fails because its null', async function () {
        const valueName = 'test-case';
        try {
            assertIsNotNull(null, valueName);
        } catch (e: any) {
            expect(e.message.includes(`${valueName} should not be null`), 'Should have thrown an error');
        }
    });

    it('should throw ZkSyncChaiMatchersPluginAssertionError for invalid account input', async () => {
        const invalidAccount = 12345;
        try {
            await getAddressOf(invalidAccount as any);
            throw new Error('Expected error was not thrown');
        } catch (e: any) {
            expect(e.message).to.include(`Expected string or addressable, got ${invalidAccount}`);
        }
    });

    it('returns true for a zkSync wallet', async () => {
        const testMnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
        const zkWallet = zk.Wallet.fromMnemonic(testMnemonic);

        const result = isWalletOrContract(zkWallet);
        expect(result);
    });

    it('returns false for a non-wallet/non-contract account', async () => {
        const nonWalletAccount = {} as any;

        const result = isWalletOrContract(nonWalletAccount);
        expect(!result);
    });

    it('should throw the original error when returnData is undefined', async () => {
        const error = new TestError('Test error');
        try {
            getReturnDataFromError(error);
            throw new Error('Expected error was not thrown');
        } catch (e: any) {
            expect(e.message.includes('Test error'), 'Should have included test error');
        }
    });

    it('should throw the original error when returnData is not a string', async () => {
        const error = new TestError('Test error with wrong data', { data: 123 });
        try {
            getReturnDataFromError(error);
            throw new Error('Expected error was not thrown');
        } catch (e: any) {
            expect(e.message.includes('Test error with wrong data'), 'Should have included test error');
        }
    });
});
