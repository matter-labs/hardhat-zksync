import { expect } from 'chai';
import { ZkSyncSolcPluginError } from '../../src/errors';

  describe('ZkSyncSolcPluginError', () => {
    it('should create a new ZkSyncSolcPluginError instance', () => {
      const message = 'Test error message';
      const parentError = new Error('Parent error');
      const error = new ZkSyncSolcPluginError(message, parentError);

      expect(error.name).to.equal("ZkSyncSolcPluginError");
      expect(error.message).to.equal(message);
      expect(error.parent?.message).to.equal(parentError.message);
    });

    it('should have the correct stack trace', () => {
      const message = 'Test error message';
      const error = new ZkSyncSolcPluginError(message);

      expect(error.stack).to.be.a('string');
      expect(error.stack).to.include('ZkSyncSolcPluginError');
      expect(error.stack).to.include(message);
    });
  });
