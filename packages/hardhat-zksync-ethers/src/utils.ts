import { HardhatNetworkAccountsConfig, HardhatNetworkHDAccountsConfig, HardhatRuntimeEnvironment, HttpNetworkAccountsConfig } from 'hardhat/types';
import { FactoryOptions, ZkSyncArtifact } from './types';
import { Wallet } from 'zksync-ethers';
import { LOCAL_CHAIN_IDS } from './constants';
import { rich_wallets } from './rich-wallets';

export function isHardhatNetworkHDAccountsConfig(object: any): object is HardhatNetworkHDAccountsConfig {
    return 'mnemonic' in object;
}

export function isHardhatNetworkAccountsConfigStrings(object: any): object is string[] {
    return typeof object[0] === 'string';
}

export function isString(object: any): object is string {
    return typeof object === 'string';
}

export function isNumber(object: any): object is number {
    return typeof object === 'number';
}

export async function getWalletsFromAccount(
    hre: HardhatRuntimeEnvironment,
    accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig
): Promise<Wallet[]> {
    if (!accounts || accounts == 'remote') {
        const chainId = await hre.zksyncEthers.provider.send('eth_chainId', []);
        if (LOCAL_CHAIN_IDS.includes(chainId)) {
            return rich_wallets.map((wallet) => new Wallet(wallet.privateKey, hre.zksyncEthers.provider));
        }
        return [];
    }

    if (isHardhatNetworkAccountsConfigStrings(accounts)) {
        const accountPrivateKeys = accounts as string[];

        const wallets = accountPrivateKeys.map(
            (accountPrivateKey) => new Wallet(accountPrivateKey, hre.zksyncEthers.provider)
        );
        return wallets;
    }

    if (isHardhatNetworkHDAccountsConfig(accounts)) {
        const account = accounts as HardhatNetworkHDAccountsConfig;

        const wallet = Wallet.fromMnemonic(account.mnemonic).connect(hre.zksyncEthers.provider);
        return [wallet];
    }

    return [];
}

export function isFactoryOptions(walletOrOptions?: Wallet | FactoryOptions): walletOrOptions is FactoryOptions {
    if (walletOrOptions === undefined || 'provider' in walletOrOptions) {
        return false;
    }

    return true;
}

export function isArtifact(artifact: any): artifact is ZkSyncArtifact {
    const {
        contractName,
        sourceName,
        abi,
        bytecode,
        deployedBytecode,
        linkReferences,
        deployedLinkReferences,
        factoryDeps,
    } = artifact;

    return (
        typeof contractName === 'string' &&
        typeof sourceName === 'string' &&
        Array.isArray(abi) &&
        typeof bytecode === 'string' &&
        typeof deployedBytecode === 'string' &&
        linkReferences !== undefined &&
        deployedLinkReferences !== undefined &&
        factoryDeps !== undefined
    );
}
