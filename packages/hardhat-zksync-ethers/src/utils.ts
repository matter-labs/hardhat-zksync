import {
    HardhatNetworkAccountsConfig,
    HardhatNetworkHDAccountsConfig,
    HardhatRuntimeEnvironment,
    HttpNetworkAccountsConfig,
    HttpNetworkConfig,
    NetworkConfig,
    Network,
    NetworksConfig,
} from 'hardhat/types';
import { Provider, Wallet } from 'zksync-ethers';
import { ethers } from 'ethers';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import fs from 'fs';
import chalk from 'chalk';
import { ETH_DEFAULT_NETWORK_RPC_URL, LOCAL_CHAIN_IDS, SUPPORTED_L1_TESTNETS } from './constants';
import { richWallets } from './rich-wallets';
import { ZkSyncEthersPluginError } from './errors';
import { FactoryOptions, ZkSyncArtifact, ContractFullQualifiedName, ContractInfo, MissingLibrary } from './types';
import { MorphBuilderInitialDefaultAssignment, MorphTsBuilder } from './morph-ts-builder';

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
        const chainId = await hre.zksyncEthers.providerL2.send('eth_chainId', []);
        if (LOCAL_CHAIN_IDS.includes(chainId)) {
            return richWallets.map((wallet) =>
                new Wallet(wallet.privateKey, hre.zksyncEthers.providerL2).connectToL1(hre.zksyncEthers.providerL1),
            );
        }
        return [];
    }

    if (isHardhatNetworkAccountsConfigStrings(accounts)) {
        const accountPrivateKeys = accounts as string[];

        const wallets = accountPrivateKeys.map((accountPrivateKey) =>
            new Wallet(accountPrivateKey, hre.zksyncEthers.providerL2).connectToL1(hre.zksyncEthers.providerL1),
        );
        return wallets;
    }

    if (isHardhatNetworkHDAccountsConfig(accounts)) {
        const account = accounts as HardhatNetworkHDAccountsConfig;

        const wallet = Wallet.fromMnemonic(account.mnemonic)
            .connect(hre.zksyncEthers.providerL2)
            .connectToL1(hre.zksyncEthers.providerL1);
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

export function createProviders(
    networks: NetworksConfig,
    network: Network,
): {
    ethWeb3Provider: ethers.Provider;
    zkWeb3Provider: Provider;
} {
    const networkName = network.name;

    if (!network.zksync) {
        throw new ZkSyncEthersPluginError(
            `Only deploying to ZKsync network is supported.\nNetwork '${networkName}' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.`,
        );
    }

    if (networkName === 'hardhat') {
        return {
            ethWeb3Provider: _createDefaultEthProvider(),
            zkWeb3Provider: _createDefaultZkProvider(),
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

    const zkWeb3Provider = new Provider((network.config as HttpNetworkConfig).url);

    return { ethWeb3Provider, zkWeb3Provider };
}

function _createDefaultEthProvider(): ethers.Provider {
    return new ethers.JsonRpcProvider(ETH_DEFAULT_NETWORK_RPC_URL);
}

function _createDefaultZkProvider(): Provider {
    return Provider.getDefaultProvider()!;
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

export function updateHardhatConfigFile(
    hre: HardhatRuntimeEnvironment,
    externalConfigObjectPath?: string,
    exportedConfigObject?: string,
) {
    try {
        new MorphTsBuilder(externalConfigObjectPath ?? hre.config.paths.configFile)
            .intialStep([
                { initialModule: 'module.exports' },
                {} as MorphBuilderInitialDefaultAssignment,
                { initialVariableType: 'HardhatUserConfig' },
                { initialVariable: exportedConfigObject },
            ])
            .nextStep({ propertyName: 'zksolc' })
            .nextStep({ propertyName: 'settings' })
            .replaceStep({ propertyName: 'libraries', replaceObject: hre.config.zksolc.settings.libraries })
            .save();
    } catch (error) {
        throw new ZkSyncEthersPluginError('Failed to update hardhat config file.');
    }
}

export function generateFullQuailfiedNameString(contractFQN: ContractFullQualifiedName | MissingLibrary): string {
    return `${contractFQN.contractPath}:${contractFQN.contractName}`;
}

export async function fillLibrarySettings(hre: HardhatRuntimeEnvironment, libraries: ContractInfo[]) {
    libraries.forEach((library) => {
        const contractPath = library.contractFQN.contractPath;
        const contractName = library.contractFQN.contractName;

        if (!hre.config.zksolc.settings.libraries) {
            hre.config.zksolc.settings.libraries = {};
        }

        hre.config.zksolc.settings.libraries[contractPath] = {
            [contractName]: library.address,
        };
    });
}

export function getLibraryInfos(hre: HardhatRuntimeEnvironment): MissingLibrary[] {
    const libraryPathFile = hre.config.zksolc.settings.missingLibrariesPath!;

    if (!fs.existsSync(libraryPathFile)) {
        throw new ZkSyncEthersPluginError('Missing libraries file does not exist');
    }

    return JSON.parse(fs.readFileSync(libraryPathFile, 'utf8'));
}

export function removeLibraryInfoFile(hre: HardhatRuntimeEnvironment) {
    const libraryPathFile = hre.config.zksolc.settings.missingLibrariesPath!;

    if (fs.existsSync(libraryPathFile)) {
        fs.rmSync(libraryPathFile);
    }
}

export async function compileContracts(hre: HardhatRuntimeEnvironment, contracts: string[]) {
    hre.config.zksolc.settings.contractsToCompile = contracts;

    await hre.run(TASK_COMPILE, { force: true });
}

export function cleanLibraries(hre: HardhatRuntimeEnvironment, opts: any) {
    hre.config.zksolc.settings.libraries = {};
    try {
        updateHardhatConfigFile(hre, opts?.externalConfigObjectPath, opts?.exportedConfigObject);
    } catch (error) {
        console.warn(chalk.red('Failed to clear libraries from the hardhat config file. Please do it manually.'));
    }
    fs.rmSync(hre.config.paths.artifacts, { recursive: true });
    fs.rmSync(hre.config.paths.cache, { recursive: true });
}

export async function updateWithCachedLibraries(hre: HardhatRuntimeEnvironment, opts: any) {
    try {
        updateHardhatConfigFile(hre, opts?.externalConfigObjectPath, opts?.exportedConfigObject);
    } catch (error) {
        console.warn(chalk.red('Failed to update hardhat config file with cached libraries. Please do it manually.'));
    }
    await hre.run(TASK_COMPILE);
    if (
        hre.config.zksolc?.settings?.missingLibrariesPath &&
        fs.existsSync(hre.config.zksolc?.settings?.missingLibrariesPath)
    ) {
        fs.rmSync(hre.config.zksolc.settings.missingLibrariesPath, { recursive: true });
    }
}
