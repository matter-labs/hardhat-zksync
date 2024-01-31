import { HardhatRuntimeEnvironment, RunSuperFunction } from 'hardhat/types';

import { getImplementationAddress, isEmptySlot, getAdminAddress } from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';
import chalk from 'chalk';
import { verifiableContracts } from '../constants';
import { verifyImplementation } from './verify-impl';
import { verifyWithArtifact } from './verify-proxy';

/**
 * Fully verifies all contracts related to the given transparent or UUPS proxy address: implementation, admin (if any), and proxy.
 *
 * This function will determine whether the address is a transparent or UUPS proxy based on whether its creation bytecode matches with
 * TransparentUpgradeableProxy or ERC1967Proxy.
 *
 * Note: this function does not use the admin slot to determine whether the proxy is transparent or UUPS, but will always verify
 * the admin address as long as the admin storage slot has an address.
 *
 * @param hre The hardhat runtime environment
 * @param proxyAddress The transparent or UUPS proxy address
 * @param hardhatVerify A function that invokes the verify plugin's verify command
 * @param runSuper A function that invokes the verify plugin's verify command
 */
export async function fullVerifyTransparentOrUUPS(
    hre: HardhatRuntimeEnvironment,
    proxyAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
    runSuper: RunSuperFunction<any>,
    noCompile: boolean = false,
    quiet: boolean = false,
) {
    const networkConfig: any = hre.network.config;
    const provider = new zk.Provider(networkConfig.url);
    const implAddress = await getImplementationAddress(provider, proxyAddress);

    await verifyImplementation(hardhatVerify, implAddress);
    await verifyTransparentOrUUPS();
    await verifyAdmin();

    async function verifyAdmin() {
        const adminAddress = await getAdminAddress(provider, proxyAddress);
        if (!isEmptySlot(adminAddress)) {
            if (!quiet) {
                console.info(chalk.cyan(`Verifying proxy admin: ${adminAddress}`));
            }
            try {
                await verifyWithArtifact(hre, adminAddress, [verifiableContracts.proxyAdmin], runSuper, noCompile);
            } catch (e: any) {
                console.error(chalk.red(`Error verifying proxy admin: ${e.message}`));
            }
        }
    }

    async function verifyTransparentOrUUPS() {
        if (!quiet) {
            console.info(chalk.cyan(`Verifying proxy: ${proxyAddress}`));
        }
        await verifyWithArtifact(
            hre,
            proxyAddress,
            [verifiableContracts.transparentUpgradeableProxy, verifiableContracts.erc1967proxy],
            runSuper,
            noCompile,
        );
    }
}
