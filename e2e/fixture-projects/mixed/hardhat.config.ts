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
        version: '1.5.15',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    defaultNetwork: 'inMemoryNode',
    networks: {
        hardhat: {
            zksync: true,
        },
        inMemoryNode: {
            url: "http://0.0.0.0:8011",
            ethNetwork: "",
            zksync: true,
        },
        dockerizedNode: {
            url: "http://0.0.0.0:3050",
            ethNetwork: "http://0.0.0.0:8545",
            zksync: true,
        },
    },
    zkvyper: {
        version: '1.5.7',
        compilerSource: 'binary',
    },
      vyper: {
        version: "0.3.3"
      },
    solidity: {
        version: '0.8.22',

    },
};

export default config;
