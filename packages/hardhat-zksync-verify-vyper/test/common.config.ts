import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-vyper";
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zkvyper: {
        compilerSource: 'binary',
        settings: {
        },
    },
    networks: {
        hardhat: {
            zksync: true,
        },
        testnet: {
            zksync: true,
            url: 'https://sepolia.era.zksync.dev',
            verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
        },
        customNetwork: {
            zksync: true,
            url: '',
        },
    },
    vyper: {
        version: '0.3.3',
    }
};

export default config;
