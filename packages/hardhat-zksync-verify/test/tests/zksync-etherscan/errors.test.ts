import { expect } from 'chai';
import { ZksyncContractVerificationInvalidStatusCodeError } from '../../../src/explorers/errors';

describe('ZksyncContractVerificationInvalidStatusCodeError', () => {
    it('should create an error with the correct message', () => {
        const url = 'http://example.com';
        const statusCode = 400;
        const responseText = 'Bad Request';

        const error = new ZksyncContractVerificationInvalidStatusCodeError(url, statusCode, responseText);

        expect(error.message).to.contains(`Failed to send contract verification request.
  Endpoint URL: ${url}
  The HTTP server response is not ok. Status code: ${statusCode} Response text: ${responseText}`);
    });
});
