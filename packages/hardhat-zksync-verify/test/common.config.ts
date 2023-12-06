import '@nomicfoundation/hardhat-verify';
import '@matterlabs/hardhat-zksync-solc';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.2.0',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: false,
        },
        customNetwork: {
            zksync: true,
            url: '',
        },
        testnet: {
            url: "https://sepolia.era.zksync.dev",
            zksync: true,
            verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
        }
    },
    solidity: {
        version: '0.8.16',
    },
};

export default config;
