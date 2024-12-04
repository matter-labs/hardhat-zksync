import * as zk from 'zksync-ethers';

export async function getChainId(provider: zk.Provider): Promise<number> {
    const id = await provider.send('eth_chainId', []);
    return parseInt(id.replace(/^0x/, ''), 16);
}

export const networkNames: { [chainId in number]?: string } = Object.freeze({
    324: 'ZKsync-era',
    280: 'ZKsync-testnet-goerli',
    270: 'ZKsync-local-setup',
    300: 'ZKsync-testnet-sepolia',
    260: 'ZKsync-anvil',
});
