import 'hardhat/types/config';

declare module 'hardhat/types/artifacts' {
    interface CompilerOutput {
        version: string;
        zk_version: string;
    }
}

declare module 'hardhat/types/config' {
    interface HttpNetworkUserConfig {
        verifyURL?: string;
    }
    interface HardhatNetworkUserConfig {
        verifyURL?: string;
    }

    interface HttpNetworkConfig {
        verifyURL?: string;
    }
    interface HardhatNetworkConfig {
        verifyURL?: string;
    }

    interface HardhatConfig {
        verifyURL?: string;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        verifyURL: string;
    }
}
