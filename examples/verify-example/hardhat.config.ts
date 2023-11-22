import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-verify';
import '@matterlabs/hardhat-zksync-zksync2js';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: '1.3.16',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'zkTestnet',
    networks: {     
        zkTestnet: {
            url: "https://zksync2-testnet.zksync.dev",
            zksync: true,
            verifyURL: "https://zksync2-testnet-explorer.zksync.dev/contract_verification",
            accounts: ["PRIVATE KEY"]
        },
        customNetwork: {
            zksync: true,
            url: ''
        }
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
