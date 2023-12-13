import * as zk from 'zksync-ethers';

export async function getChainId(provider: zk.Provider): Promise<number> {
    const id = await provider.send('eth_chainId', []);
    return parseInt(id.replace(/^0x/, ''), 16);
}

export const networkNames: { [chainId in number]?: string } = Object.freeze({
    324: 'zkSync-era',
    280: 'zkSync-testnet',
    270: 'zkSync-local-setup',
});
