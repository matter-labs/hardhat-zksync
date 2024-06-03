export const networkNames: { [chainId in number]?: string } = Object.freeze({
    324: 'zkSync-era',
    280: 'zkSync-testnet-goerli',
    270: 'zkSync-local-setup',
    300: 'zkSync-testnet-sepolia',
    260: 'zkSync-era-test-node',
});

export interface EthereumProvider {
    send(method: 'anvil_metadata' | 'hardhat_metadata', params: []): Promise<HardhatMetadata>;
    send(method: 'web3_clientVersion' | 'net_version' | 'eth_chainId' | 'eth_instanceId', params: []): Promise<string>;
    send(method: 'eth_getCode', params: [string, string]): Promise<string>;
    send(method: 'eth_call', params: unknown[]): Promise<string>;
    send(method: 'eth_getStorageAt', params: [string, string, string]): Promise<string>;
    send(method: 'eth_getTransactionByHash', params: [string]): Promise<null | EthereumTransaction>;
    send(method: 'eth_getTransactionReceipt', params: [string]): Promise<null | EthereumTransactionReceipt>;
    send(method: string, params: unknown[]): Promise<unknown>;
}

export interface HardhatMetadata {
    clientVersion: string;
    chainId: number;
    instanceId: string;
    forkedNetwork?: {
        // The chainId of the network that is being forked
        chainId: number;
    } | null;
}

interface EthereumTransaction {
    blockHash: string | null;
    input: string;
}

interface EthereumTransactionReceipt {
    status: string;
    to: string | null;
    from: string;
    blockHash: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
}

export async function getNetworkId(provider: EthereumProvider): Promise<string> {
    return provider.send('net_version', []);
}

export async function getChainId(provider: EthereumProvider): Promise<number> {
    const id = await provider.send('eth_chainId', []);
    return parseInt(id.replace(/^0x/, ''), 16);
}

export async function getClientVersion(provider: EthereumProvider): Promise<string> {
    return provider.send('web3_clientVersion', []);
}

/**
 * Gets Hardhat metadata when used with Hardhat 2.12.3 or later.
 * The underlying provider will throw an error if this RPC method is not available.
 */
export async function getHardhatMetadata(provider: EthereumProvider): Promise<HardhatMetadata> {
    return provider.send('hardhat_metadata', []);
}

/**
 * Anvil could have anvil_metadata, for which hardhat_metadata is an alias.
 */
export async function getAnvilMetadata(provider: EthereumProvider): Promise<HardhatMetadata> {
    return provider.send('anvil_metadata', []);
}

export async function getStorageAt(
    provider: EthereumProvider,
    address: string,
    position: string,
    block = 'latest',
): Promise<string> {
    const storage = await provider.send('eth_getStorageAt', [address, position, block]);
    const padded = storage.replace(/^0x/, '').padStart(64, '0');
    return `0x${padded}`;
}

export async function getCode(provider: EthereumProvider, address: string, block = 'latest'): Promise<string> {
    return provider.send('eth_getCode', [address, block]);
}

export async function call(
    provider: EthereumProvider,
    address: string,
    data: string,
    block = 'latest',
): Promise<string> {
    return provider.send('eth_call', [
        {
            to: address,
            data,
        },
        block,
    ]);
}

export async function hasCode(provider: EthereumProvider, address: string, block?: string): Promise<boolean> {
    const code = await getCode(provider, address, block);
    return !isEmpty(code);
}

export function isEmpty(code: string) {
    return code.replace(/^0x/, '') === '';
}

export async function getTransactionByHash(
    provider: EthereumProvider,
    txHash: string,
): Promise<EthereumTransaction | null> {
    return provider.send('eth_getTransactionByHash', [txHash]);
}

export async function getTransactionReceipt(
    provider: EthereumProvider,
    txHash: string,
): Promise<EthereumTransactionReceipt | null> {
    const receipt = await provider.send('eth_getTransactionReceipt', [txHash]);
    if (receipt?.status) {
        receipt.status = receipt.status.match(/^0x0+$/) ? '0x0' : receipt.status.replace(/^0x0+/, '0x');
    }
    return receipt;
}

export async function isDevelopmentNetwork(provider: EthereumProvider): Promise<boolean> {
    const chainId = await getChainId(provider);
    //  1337 => ganache and geth --dev
    // 31337 => hardhat network
    if (chainId === 1337 || chainId === 31337) {
        return true;
    } else {
        const clientVersion = await getClientVersion(provider);
        const [name] = clientVersion.split('/', 1);
        return name === 'HardhatNetwork' || name === 'EthereumJS TestRPC' || name === 'anvil';
    }
}

export function isReceiptSuccessful(receipt: Pick<EthereumTransactionReceipt, 'status'>): boolean {
    return receipt.status === '0x1';
}
