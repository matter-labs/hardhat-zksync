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

export function checkOpenzeppelinVersions<T>(wrappedFunction: (...args: any) => T): (...args: any) => T {
    return function (...args: any): T {
        try {
            if (!isOpenzeppelinContractsVersionValid()) {
                throw new Error(OZ_CONTRACTS_VERISION_INCOMPATIBLE_ERROR);
            }
        } catch (e: any) {
            console.warn(chalk.yellow(e.message));
        }
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
