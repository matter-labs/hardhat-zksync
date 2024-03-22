import '@matterlabs/hardhat-zksync-solc';
import "@nomiclabs/hardhat-vyper";
import "@matterlabs/hardhat-zksync-vyper";
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-node';
import '@matterlabs/hardhat-zksync-upgradable';

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
    networks: {
        hardhat: {
            zksync: true,
        },
        inMemoryNode: {
            url: "http://localhost:8011",
            ethNetwork: "",
            zksync: true,
        },
        dockerizedNode: {
            url: "http://localhost:3050",
            ethNetwork: "http://localhost:8545",
            zksync: true,
        },
    },
    zkvyper: {
        version: 'latest',
        compilerSource: 'binary',
    },
      vyper: {
        version: "0.3.3"
      },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
