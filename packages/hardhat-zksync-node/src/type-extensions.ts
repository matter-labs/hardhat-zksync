import 'hardhat/types/config';

declare module 'hardhat/types/config' {
    interface HardhatNetworkUserConfig {
        zksync?: boolean;
        ethNetwork?: string;
    }

    interface HttpNetworkUserConfig {
        zksync?: boolean;
    }

    interface HardhatNetworkConfig {
        zksync: boolean;
        url: string;
    }

    interface HttpNetworkConfig {
        zksync: boolean;
        ethNetwork?: string;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        zksync: boolean;
    }
}
