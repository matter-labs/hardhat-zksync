import { ChainConfig } from '@nomicfoundation/hardhat-verify/types';

export const builtinChains: ChainConfig[] = [
    {
        network: 'zksyncmainnet',
        chainId: 270,
        urls: {
            apiURL: 'https://api-era.zksync.network/api',
            browserURL: 'https://era.zksync.network/',
        },
    },
    {
        network: 'zksyncsepolia',
        chainId: 300,
        urls: {
            apiURL: 'https://api-sepolia-era.zksync.network/api',
            browserURL: 'https://sepolia-era.zksync.network/',
        },
    },
];
