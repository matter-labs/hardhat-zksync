import { NomicLabsHardhatPluginError } from "hardhat/plugins";

export class HardhatZksyncViemError extends NomicLabsHardhatPluginError {
  constructor(message: string, parent?: Error) {
    super("@matterlabs/hardhat-zksync-viem", message, parent);
  }
}

export class UnknownDevelopmentNetworkError extends HardhatZksyncViemError {
  constructor() {
    super(`The chain id corresponds to a development network but we couldn't detect which one.
Please report this issue if you're using Hardhat or Foundry.`);
  }
}

export class NetworkNotFoundError extends HardhatZksyncViemError {
  constructor(chainId: number) {
    super(
      `No network with chain id ${chainId} found. You can override the chain by passing it as a parameter to the client getter:
import { someChain } from "viem/chains";
const client = await viem.createPublicClient({
  chain: someChain,
  ...
});
You can find a list of supported networks here: https://viem.sh/docs/clients/chains.html`
    );
  }
}

export class MultipleMatchingNetworksError extends HardhatZksyncViemError {
  constructor(chainId: number) {
    super(
      `Multiple networks with chain id ${chainId} found. You can override the chain by passing it as a parameter to the client getter:
import { someChain } from "viem/chains";
const client = await viem.createPublicClient({
  chain: someChain,
  ...
});
You can find a list of supported networks here: https://viem.sh/docs/clients/chains.html`
    );
  }
}

export class InvalidConfirmationsError extends HardhatZksyncViemError {
  constructor() {
    super(
      "deployContract does not support 0 confirmations. Use sendDeploymentTransaction if you want to handle the deployment transaction yourself."
    );
  }
}

export class DeployContractError extends HardhatZksyncViemError {
  constructor(txHash: string, blockNumber: bigint) {
    super(
      `The deployment transaction '${txHash}' was mined in block '${blockNumber}' but its receipt doesn't contain a contract address`
    );
  }
}

export class DefaultWalletClientNotFoundError extends HardhatZksyncViemError {
  constructor(networkName: string) {
    super(
      `Default wallet client not found. This can happen if no accounts were configured for this network (network: '${networkName}').
  
  Alternatively, you can set a custom wallet client by passing it as a parameter in the deployContract function:
  
  const walletClient = await hre.viem.getWalletClient(address);
  const contractA = await hre.viem.deployContract("A", [], { walletClient });
  const contractB = await hre.viem.getContractAt("B", address, { walletClient });`
    );
  }
}
