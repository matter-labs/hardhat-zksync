require('@nomicfoundation/hardhat-verify');
require('@matterlabs/hardhat-zksync-solc');

module.exports = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {},
    },
    networks: {
        hardhat: {
            zksync: false,
        },
        zkSyncTestnet: {
            zksync: true,
            url: 'https://sepolia.era.zksync.dev',
            ethNetwork: 'sepolia',
            verifyURL: 'https://explorer.sepolia.era.zksync.dev/contract_verification',
        },
        zkSyncMainnet: {
            zksync: true,
            url: 'https://mainnet.era.zksync.io',
            ethNetwork: 'mainnet',
            verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification',
        },
    },
    solidity: {
        version: '0.8.16',
    },
    etherscan: {
        apiKey: {
            zkSyncTestnet: 'your-api-key-here', // Not required for zkSync Era
            zkSyncMainnet: 'your-api-key-here', // Not required for zkSync Era
        },
    },
};
