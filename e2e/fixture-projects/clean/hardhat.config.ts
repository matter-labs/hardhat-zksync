import '@matterlabs/hardhat-zksync-solc';

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
    defaultNework: 'inMemoryNode',
    networks: {
        hardhat: {
            zksync: true,
        },
        inMemoryNode: {
            url: "http://0.0.0.0:8011",
            ethNetwork: "",
            zksync: true,
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    solidity: {
        version: '0.8.17',
    },
};

export default config;
