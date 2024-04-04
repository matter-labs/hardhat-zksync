// @ts-nocheck
import {
    EthereumProvider,
    HardhatNetworkAccountsConfig,
    HardhatNetworkHDAccountsConfig,
    HardhatRuntimeEnvironment,
    HttpNetworkAccountsConfig,
    HttpNetworkConfig,
    NetworkConfig,
} from 'hardhat/types';
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names';
import fs from 'fs';
import { Wallet } from 'zksync-ethers';
import { ContractFullQualifiedName, ContractInfo, MissingLibrary } from './types';
import { MorphBuilderInitialDefaultAssignment, MorphTsBuilder } from './morph-ts-builder';
import { ZkSyncDeployPluginError } from './errors';
import { LOCAL_CHAIN_IDS } from './constants';
import { richWallets } from './rich-wallets';

export function isHttpNetworkConfig(networkConfig: NetworkConfig): networkConfig is HttpNetworkConfig {
    return 'url' in networkConfig;
}

export function updateHardhatConfigFile(
    hre: HardhatRuntimeEnvironment,
    externalConfigObjectPath: string,
    exportedConfigObject: string,
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
        throw new ZkSyncDeployPluginError(
            'Failed to update hardhat config file, please use addresses from console output',
        );
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
        throw new ZkSyncDeployPluginError('Missing libraries file not found');
    }

    return JSON.parse(fs.readFileSync(libraryPathFile, 'utf8'));
}

export function removeLibraryInfoFile(hre: HardhatRuntimeEnvironment) {
    const libraryPathFile = hre.config.zksolc.settings.missingLibrariesPath!;

    if (fs.existsSync(libraryPathFile)) {
        fs.rmSync(libraryPathFile);
    }
}

export function isValidEthNetworkURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

export async function compileContracts(hre: HardhatRuntimeEnvironment, contracts: string[]) {
    hre.config.zksolc.settings.contractsToCompile = contracts;

    await hre.run(TASK_COMPILE, { force: true });
}

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
        const chainId = await hre.network.provider.send('eth_chainId', []);
        if (LOCAL_CHAIN_IDS.includes(chainId)) {
            return richWallets.map((wallet) => new Wallet(wallet.privateKey));
        }
        return [];
    }

    if (isHardhatNetworkAccountsConfigStrings(accounts)) {
        const accountPrivateKeys = accounts as string[];

        const wallets = accountPrivateKeys.map((accountPrivateKey) => new Wallet(accountPrivateKey));
        return wallets;
    }

    if (isHardhatNetworkHDAccountsConfig(accounts)) {
        const account = accounts as HardhatNetworkHDAccountsConfig;

        const wallet = Wallet.fromMnemonic(account.mnemonic);
        return [wallet];
    }

    return [];
}

export async function retrieveContractBytecode(address: string, provider: EthereumProvider): Promise<string> {
    const bytecodeString = (await provider.send('eth_getCode', [address, 'latest'])) as string;

    if (!bytecodeString || bytecodeString.length === 0) {
        return undefined;
    }
    return bytecodeString;
}

export async function getConstructorArguments(
    constructorArgsParams: any[],
    constructorArgsModule?: string,
): Promise<any> {
    if (typeof constructorArgsModule !== 'string') {
        return constructorArgsParams;
    }

    const constructorArgsModulePath = path.resolve(process.cwd(), constructorArgsModule);

    try {
        const constructorArguments = await extractModule(constructorArgsModulePath);

        if (!Array.isArray(constructorArguments) && !constructorArguments.startsWith('0x')) {
            throw new ZkSyncVerifyPluginError(ENCODED_ARAGUMENTS_NOT_FOUND_ERROR(constructorArgsModulePath));
        }
        return constructorArguments;
    } catch (error: any) {
        throw new ZkSyncVerifyPluginError(CONSTRUCTOR_MODULE_IMPORTING_ERROR(error.message), error);
    }
}

export async function extractModule(constructorArgsModulePath: string) {
    const constructorArguments = (await import(constructorArgsModulePath)).default;
    return constructorArguments;
}
