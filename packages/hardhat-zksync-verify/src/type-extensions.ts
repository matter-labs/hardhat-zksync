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
        apiKey?: string;
    }
    interface HardhatNetworkUserConfig {
        verifyURL?: string;
        apiKey?: string;
    }

    interface HttpNetworkConfig {
        verifyURL?: string;
        apiKey?: string;
    }
    interface HardhatNetworkConfig {
        verifyURL?: string;
        apiKey?: string;
    }

    interface HardhatConfig {
        verifyURL?: string;
        apiKey?: string;
    }

    interface SolcConfig {
        eraVersion?: string;
    }

    interface SolcUserConfig {
        eraVersion?: string;
    }
}

declare module 'hardhat/types/runtime' {
    interface Network {
        verifyURL: string;
        apiKey: string;
    }
}
