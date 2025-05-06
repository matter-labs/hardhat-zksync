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
        enableVerifyURL?: boolean;
    }
    interface HardhatNetworkUserConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
        enableVerifyURL?: boolean;
    }

    interface HttpNetworkConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
        enableVerifyURL?: boolean;
    }
    interface HardhatNetworkConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
        enableVerifyURL?: boolean;
    }

    interface HardhatConfig {
        verifyURL?: string;
        browserVerifyURL?: string;
        enableVerifyURL?: boolean;
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
        enableVerifyURL: boolean;
    }
}
