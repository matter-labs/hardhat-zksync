import { HardhatUserConfig } from 'hardhat/config';

import '../../../src/index';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.2.2',
        compilerSource: 'binary',
    },
    zkvyper: {
        version: '1.2.0',
        compilerSource: 'binary',
    },
    networks: {
        ethNetwork: {
            url: 'http://0.0.0.0:8545',
        },
        zkSyncNetwork: {
            zksync: true,
            url: 'http://0.0.0.0:3050',
            ethNetwork: 'ethNetwork',
            verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
        },
    },
    vyper: {
        version: "0.3.3",
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
