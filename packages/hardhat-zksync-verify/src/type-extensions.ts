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
        apikey?: string;
    }
    interface HardhatNetworkUserConfig {
        verifyURL?: string;
        apikey?: string;
    }

    interface HttpNetworkConfig {
        verifyURL?: string;
        apikey?: string;
    }
    interface HardhatNetworkConfig {
        verifyURL?: string;
        apikey?: string;
    }

    interface HardhatConfig {
        verifyURL?: string;
        apikey?: string;
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
        apikey: string;
    }
}
