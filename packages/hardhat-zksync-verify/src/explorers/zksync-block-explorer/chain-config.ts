import { ChainConfig } from '@nomicfoundation/hardhat-verify/types';

export const builtinChains: ChainConfig[] = [
    {
        network: 'zksyncmainnet',
        chainId: 324,
        urls: {
            apiURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification',
            browserURL: 'https://explorer.zksync.io/',
        },
    },
    {
        network: 'zksyncsepolia',
        chainId: 300,
        urls: {
            apiURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
            browserURL: 'https://sepolia.explorer.zksync.io/',
        },
    },
];
