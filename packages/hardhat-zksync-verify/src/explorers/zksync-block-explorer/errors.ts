import { ZkSyncVerifyPluginError } from '../../errors';

export class ZksyncMissingApiKeyError extends ZkSyncVerifyPluginError {
    constructor(network: string) {
        super(`You are trying to verify a contract in '${network}', but no API token was found for this network. Please provide one in your hardhat config. For example:
  
  {
    ...
    etherscan: {
      apiKey: {
        ${network}: 'your API key'
      }
    }
  }
  
  See https://etherscan.io/apis`);
    }
}
