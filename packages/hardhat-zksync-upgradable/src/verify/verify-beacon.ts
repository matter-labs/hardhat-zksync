import { getBeaconAddress, getImplementationAddressFromBeacon } from '@openzeppelin/upgrades-core';
import { HardhatRuntimeEnvironment, RunSuperFunction } from 'hardhat/types';

import { Provider } from 'zksync-ethers';
import chalk from 'chalk';
import { verifiableContracts } from '../constants';
import { verifyWithArtifact } from './verify-proxy';
import { verifyImplementation } from './verify-impl';

export async function fullVerifyBeacon(
    hre: HardhatRuntimeEnvironment,
    beaconAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
    runSuper: RunSuperFunction<any>,
    noCompile: boolean = false,
    quiet: boolean = false,
) {
    const networkConfig: any = hre.network.config;
    const provider = new Provider(networkConfig.url);

    const implAddress = await getImplementationAddressFromBeacon(provider, beaconAddress);
    await verifyImplementation(hardhatVerify, implAddress);
    await verifyBeacon();

    async function verifyBeacon() {
        if (!quiet) {
            console.info(chalk.cyan(`Verifying beacon: ${beaconAddress}`));
        }
        await verifyWithArtifact(hre, beaconAddress, [verifiableContracts.upgradeableBeacon], runSuper, noCompile);
    }
}

export async function fullVerifyBeaconProxy(
    hre: HardhatRuntimeEnvironment,
    proxyAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
    runSuper: RunSuperFunction<any>,
    noCompile: boolean = false,
    quiet: boolean = false,
) {
    const networkConfig: any = hre.network.config;
    const provider = new Provider(networkConfig.url);
    const beaconAddress = await getBeaconAddress(provider, proxyAddress);

    await fullVerifyBeacon(hre, beaconAddress, hardhatVerify, runSuper, noCompile);
    await verifyBeaconProxy();

    async function verifyBeaconProxy() {
        if (!quiet) {
            console.info(chalk.cyan(`Verifying beacon proxy: ${proxyAddress}`));
        }
        await verifyWithArtifact(hre, proxyAddress, [verifiableContracts.beaconProxy], runSuper, noCompile);
    }
}
