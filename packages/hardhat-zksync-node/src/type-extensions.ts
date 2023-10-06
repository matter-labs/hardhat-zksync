import 'hardhat/types/config';

declare module 'hardhat/types/config' {
    interface HardhatNetworkUserConfig {
        zksync?: boolean;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }
}
