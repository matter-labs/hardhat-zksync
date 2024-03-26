import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-node';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork:'dockerizedNode',
    networks: {
        hardhat: {
            zksync: true,
        },
        dockerizedNode: {
            url: "http://localhost:3050",
            ethNetwork: "http://localhost:8545",
            zksync: true,
          },
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
