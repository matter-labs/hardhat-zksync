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