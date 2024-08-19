import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-ethers';
import { getNetworkAccount, getWallet as getRealWallet } from '@matterlabs/hardhat-zksync-deploy/dist/plugin';
import { createProviders } from '@matterlabs/hardhat-zksync-deploy/dist/deployer-helper';
import chalk from 'chalk';
import semver from 'semver';
import {
    OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR,
    UPGRADEABLE_CONTRACTS_FROM_ALIAS,
    UPGRADEABLE_CONTRACTS_FROM_CONTRACTS,
} from './constants';

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const { ethWeb3Provider, zkWeb3Provider } = createProviders(hre.config.networks, hre.network);

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
        try {
            if (!isOpenzeppelinContractsVersionValid()) {
                throw new Error(OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR);
            }
        } catch (e: any) {
            console.warn(chalk.yellow(e.message));
        }

        const upgradableContracts = getUpgradableContracts();
        // @ts-ignore
        hre.config.zksolc.settings.overrideContractsToCompile = [
            upgradableContracts.ProxyAdmin,
            upgradableContracts.TransparentUpgradeableProxy,
            upgradableContracts.BeaconProxy,
            upgradableContracts.UpgradeableBeacon,
            upgradableContracts.ERC1967Proxy,
        ];
        await hre.run('compile', { quiet: true });
        // @ts-ignore
        hre.config.zksolc.settings.overrideContractsToCompile = undefined;

        return wrappedFunction(...args);
    };
}

export function isOpenzeppelinContractsVersionValid(): boolean {
    try {
        // eslint-disable-next-line import/no-extraneous-dependencies
        const versionContracts = require('@openzeppelin/contracts/package.json').version;
        if (!versionContracts || semver.lt(versionContracts, '4.6.0') || semver.gt(versionContracts, '5.0.0')) {
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
