import { expect } from 'chai';
import { ZksyncMissingApiKeyError } from '../../../src/explorers/zksync-block-explorer/errors';

describe('ZksyncMissingApiKeyError', () => {
    it('should create an instance with the correct message', () => {
        const network = 'testnet';
        const error = new ZksyncMissingApiKeyError(network);
        expect(error.message).to.contains(`You are trying to verify a contract in '${network}'`);
    });
});
