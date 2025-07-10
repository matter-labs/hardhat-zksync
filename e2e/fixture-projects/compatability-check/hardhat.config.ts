import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-node';
import '@matterlabs/hardhat-zksync-upgradable';

const config = {
    zksolc: {
        version: "1.5.15",
        compilerSource: 'binary',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
            codegen: "yul",
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
