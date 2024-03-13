import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-node';

const config = {
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
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
