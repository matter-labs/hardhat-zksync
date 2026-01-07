import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-ethers';
import '@matterlabs/hardhat-zksync-deploy';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: '1.5.15',
        settings: {
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'zkSyncTestnet',
    networks: {
        zkSyncTestnet: {
            url: 'https://sepolia.era.zksync.dev',
            ethNetwork: 'sepolia',
            zksync: true,
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
        },
    },
    solidity: {
        version: '0.8.16',
    },
};

export default config;
