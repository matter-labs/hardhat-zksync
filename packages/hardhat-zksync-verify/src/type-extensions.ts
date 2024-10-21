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
        browserVerifyURL?: string;
    }
    interface HardhatNetworkUserConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
    }

    interface HttpNetworkConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
    }
    interface HardhatNetworkConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
    }

    interface HardhatConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
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
        browserVerifyURL: string;
    }
}
