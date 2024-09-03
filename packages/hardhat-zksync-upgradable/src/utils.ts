import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-ethers';
import { getNetworkAccount, getWallet as getRealWallet } from '@matterlabs/hardhat-zksync-deploy/dist/plugin';
import { Providers, createProviders } from '@matterlabs/hardhat-zksync-deploy/dist/deployer-helper';
import semver from 'semver';
import chalk from 'chalk';
import {
    OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR,
    UPGRADEABLE_CONTRACTS_FROM_ALIAS,
    UPGRADEABLE_CONTRACTS_FROM_CONTRACTS,
} from './constants';

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const { ethWeb3Provider, zkWeb3Provider }: Providers = createProviders(hre.config.networks, hre.network);

    const wallet = (await getRealWallet(hre, privateKeyOrIndex ?? getNetworkAccount(hre)))
        .connect(zkWeb3Provider)
        .connectToL1(ethWeb3Provider);
    return wallet;
}

export function wrapMakeFunction<T>(
    hre: HardhatRuntimeEnvironment,
    wrappedFunction: (...args: any) => T,
): (...args: any) => Promise<T> {
    return async function (...args: any): Promise<T> {
        checkOpenzeppelinVersion();

        await compileProxyContracts(hre);

        return wrappedFunction(...args);
    };
}

function checkOpenzeppelinVersion() {
    try {
        if (!isOpenzeppelinContractsVersionValid()) {
            throw new Error(OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR);
        }
    } catch (e: any) {
        console.warn(chalk.yellow(e.message));
    }
}

export async function compileProxyContracts(hre: HardhatRuntimeEnvironment, noCompile: boolean = false) {
    if (noCompile) {
        return;
    }

    const upgradableContracts = getUpgradableContracts();
    hre.config.zksolc.settings.forceContractsToCompile = [
        upgradableContracts.ProxyAdmin,
        upgradableContracts.TransparentUpgradeableProxy,
        upgradableContracts.BeaconProxy,
        upgradableContracts.UpgradeableBeacon,
        upgradableContracts.ERC1967Proxy,
    ];
    await hre.run('compile', { quiet: true });
    delete hre.config.zksolc.settings.forceContractsToCompile;
}

export function isOpenzeppelinContractsVersionValid(): boolean {
    try {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const versionContracts = require('@openzeppelin/contracts/package.json').version;
        if (!versionContracts || semver.lt(versionContracts, '5.0.0')) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function getUpgradableContracts() {
    if (isOpenzeppelinContractsVersionValid()) {
        return UPGRADEABLE_CONTRACTS_FROM_CONTRACTS;
    }

    return UPGRADEABLE_CONTRACTS_FROM_ALIAS;
}

export function tryRequire(id: string, resolveOnly?: boolean) {
    try {
        if (resolveOnly) {
            require.resolve(id);
        } else {
            require(id);
        }
        return true;
    } catch (e: any) {
        // do nothing
    }
    return false;
}

export type UndefinedFunctionType = (...args: any[]) => any;

export function makeUndefinedFunction(): UndefinedFunctionType {
    return (..._: any[]) => {
        throw new Error('This function is not implemented');
    };
}
