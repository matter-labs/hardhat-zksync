import { EthereumProvider } from "hardhat/types";
import { Chain, PublicClient, PublicClientConfig } from "viem";
import { getChain, isDevelopmentNetwork } from "./chains";


export async function getPublicClient(
    provider: EthereumProvider,
    publicClientConfig?: Partial<PublicClientConfig>
): Promise<PublicClient> {
    const chain = publicClientConfig?.chain ?? (await getChain(provider));
    return innerGetPublicClient(provider, chain, publicClientConfig);
}

export async function innerGetPublicClient(
    provider: EthereumProvider,
    chain: Chain,
    publicClientConfig?: Partial<PublicClientConfig>
): Promise<PublicClient> {
    const viem = await import("viem");
    const parameters = {
        ...(isDevelopmentNetwork(chain.id) && {
            pollingInterval: 50,
            cacheTime: 0,
        }),
        ...publicClientConfig,
    };

    const publicClient = viem.createPublicClient({
        chain,
        transport: viem.custom(provider),
        ...parameters,
    });

    return publicClient;
}
