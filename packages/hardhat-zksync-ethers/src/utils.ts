import {
    HardhatNetworkAccountsConfig,
    HardhatNetworkHDAccountsConfig,
    HardhatRuntimeEnvironment,
    HttpNetworkAccountsConfig,
    HttpNetworkConfig,
    NetworkConfig,
} from 'hardhat/types';
import { Provider, Signer, Wallet } from 'zksync-ethers';
import { ethers } from 'ethers';
import { isAddressEq } from 'zksync-ethers/build/utils';
import {
    HardhatZksyncSignerOrWallet,
    HardhatZksyncSignerOrWalletOrFactoryOptions,
    ZkFactoryOptions,
    ZkSyncArtifact,
} from './types';
import {
    ETH_DEFAULT_NETWORK_RPC_URL,
    LOCAL_CHAIN_IDS,
    LOCAL_CHAIN_IDS_ENUM,
    LOCAL_CHAINS_WITH_IMPERSONATION,
    SUPPORTED_L1_TESTNETS,
} from './constants';
import { richWallets } from './rich-wallets';
import { ZkSyncEthersPluginError } from './errors';
import { HardhatZksyncEthersProvider } from './hardhat-zksync-provider';
import { HardhatZksyncSigner } from './signers/hardhat-zksync-signer';
import { getWallets } from './helpers';

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
    accounts: HardhatNetworkAccountsConfig | HttpNetworkAccountsConfig,
): Promise<Wallet[]> {
    if (!accounts || accounts === 'remote') {
        return await getRichWalletsIfPossible(hre);
    }

    if (isHardhatNetworkAccountsConfigStrings(accounts)) {
        const accountPrivateKeys = accounts as string[];

        const wallets = accountPrivateKeys.map((accountPrivateKey) =>
            new Wallet(accountPrivateKey, hre.ethers.provider).connectToL1(hre.ethers.providerL1),
        );
        return wallets;
    }

    if (isHardhatNetworkHDAccountsConfig(accounts)) {
        const account = accounts as HardhatNetworkHDAccountsConfig;

        const wallet = Wallet.fromMnemonic(account.mnemonic)
            .connect(hre.ethers.provider)
            .connectToL1(hre.ethers.providerL1);
        return [wallet];
    }

    return [];
}

export function isFactoryOptions(
    walletOrOptions?: (Wallet | Signer) | ZkFactoryOptions,
): walletOrOptions is ZkFactoryOptions {
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

export function createProviders(hre: HardhatRuntimeEnvironment): {
    ethWeb3Provider: ethers.Provider;
    zkWeb3Provider: HardhatZksyncEthersProvider;
} {
    const network = hre.network;
    const networks = hre.config.networks;

    const networkName = network.name;

    if (!network.zksync) {
        throw new ZkSyncEthersPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.`,
        );
    }

    if (networkName === 'hardhat') {
        return {
            ethWeb3Provider: _createDefaultEthProvider(),
            zkWeb3Provider: _createDefaultZkProvider(hre),
        };
    }

    const networkConfig = network.config;

    if (!isHttpNetworkConfig(networkConfig)) {
        throw new ZkSyncEthersPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'url' specified.`,
        );
    }

    if (networkConfig.ethNetwork === undefined) {
        throw new ZkSyncEthersPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'ethNetwork' (layer 1) specified.`,
        );
    }

    let ethWeb3Provider;
    const ethNetwork = networkConfig.ethNetwork;

    if (SUPPORTED_L1_TESTNETS.includes(ethNetwork)) {
        ethWeb3Provider =
            ethNetwork in networks && isHttpNetworkConfig(networks[ethNetwork])
                ? new ethers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                : ethers.getDefaultProvider(ethNetwork);
    } else {
        if (ethNetwork === 'localhost' || ethNetwork === '') {
            ethWeb3Provider = _createDefaultEthProvider();
        } else if (isValidEthNetworkURL(ethNetwork)) {
            ethWeb3Provider = new ethers.JsonRpcProvider(ethNetwork);
        } else {
            ethWeb3Provider =
                ethNetwork in networks && isHttpNetworkConfig(networks[ethNetwork])
                    ? new ethers.JsonRpcProvider((networks[ethNetwork] as HttpNetworkConfig).url)
                    : ethers.getDefaultProvider(ethNetwork);
        }
    }

    const zkWeb3Provider = new HardhatZksyncEthersProvider(hre, (network.config as HttpNetworkConfig).url);

    return { ethWeb3Provider, zkWeb3Provider };
}

export async function findWalletFromAddress(
    hre: HardhatRuntimeEnvironment,
    address: string,
    wallets?: Wallet[],
): Promise<Wallet | undefined> {
    if (!wallets) {
        wallets = await getWallets(hre);
    }
    return wallets.find((w) => isAddressEq(w.address, address));
}

export async function getSignerAccounts(hre: HardhatRuntimeEnvironment): Promise<string[]> {
    const accounts: [] = await hre.ethers.provider.send('eth_accounts', []);

    if (!accounts || accounts.length === 0) {
        const wallets = await getWallets(hre);
        return wallets.map((w) => w.address);
    }

    const allWallets = await getWallets(hre);

    return accounts.filter((account: string) => allWallets.some((wallet) => isAddressEq(wallet.address, account)));
}

export async function getRichWalletsIfPossible(hre: HardhatRuntimeEnvironment): Promise<Wallet[]> {
    const chainId = await hre.ethers.providerL2.send('eth_chainId', []);
    if (LOCAL_CHAIN_IDS.includes(chainId)) {
        const chainIdEnum = chainId as LOCAL_CHAIN_IDS_ENUM;

        return richWallets[chainIdEnum].map((wallet) =>
            new Wallet(wallet.privateKey, hre.ethers.provider).connectToL1(hre.ethers.providerL1),
        );
    }
    return [];
}

function _createDefaultEthProvider(): ethers.Provider {
    return new ethers.JsonRpcProvider(ETH_DEFAULT_NETWORK_RPC_URL);
}

function _createDefaultZkProvider(hre: HardhatRuntimeEnvironment): HardhatZksyncEthersProvider {
    return new HardhatZksyncEthersProvider(hre);
}

export function getSignerOrWallet(
    signerWalletOrFactoryOptions?: HardhatZksyncSignerOrWalletOrFactoryOptions,
): HardhatZksyncSignerOrWallet | undefined {
    if (signerWalletOrFactoryOptions === undefined) {
        return undefined;
    }

    if (isFactoryOptions(signerWalletOrFactoryOptions)) {
        if (signerWalletOrFactoryOptions.wallet) {
            return signerWalletOrFactoryOptions.wallet as Wallet;
        } else if (signerWalletOrFactoryOptions.signer) {
            return signerWalletOrFactoryOptions.signer as HardhatZksyncSigner;
        }

        return undefined;
    }

    return signerWalletOrFactoryOptions as HardhatZksyncSignerOrWallet;
}

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function isValidEthNetworkURL(string: string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export async function isImpersonatedSigner(provider: Provider, address: string): Promise<boolean> {
    const chainId = await provider.send('eth_chainId', []);

    if (!LOCAL_CHAINS_WITH_IMPERSONATION.includes(chainId)) {
        return false;
    }

    const result = await provider.send('hardhat_stopImpersonatingAccount', [address]);

    if (!result) {
        return false;
    }

    await provider.send('hardhat_impersonateAccount', [address]);
    return true;
}
