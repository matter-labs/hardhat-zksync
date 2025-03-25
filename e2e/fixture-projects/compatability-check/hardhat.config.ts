import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-node';
import '@matterlabs/hardhat-zksync-upgradable';

const config = {
    zksolc: {
        verstion: "1.4.3",
        compilerSource: 'binary',
        settings: {
            isSystem: true,
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
            ethNetwork: "http://0.0.0.0:8545",
            zksync: true,
        },
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
