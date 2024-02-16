import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '0.8.17', // Explicitly specifying the zksolc version for clarity
        compilerSource: 'binary',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
                runs: 200, // Optimizing the number of runs for contract deployment and execution trade-off
            },
        }
    },
    networks: {
        hardhat: {
            zksync: true, // Enabling zkSync emulation in the Hardhat local environment
        },
        // Adding a configuration for the zkSync test network to facilitate testing and deployment
        zksyncTestnet: {
            url: 'https://zksync2-testnet.zksync.dev',
            zksync: true, // Enabling zkSync support for the testnet
            accounts: ['your_private_key_here'], // Replace this with your private key or use secure key management practices
        },
    },
    solidity: {
        version: '0.8.17',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200, // Aligning Solidity optimizer runs with zksolc for consistency
            },
        },
    },
};

export default config;

