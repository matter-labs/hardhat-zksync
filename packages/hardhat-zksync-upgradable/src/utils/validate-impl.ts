import {
    assertNotProxy,
    assertStorageUpgradeSafe,
    assertUpgradeSafe,
    getImplementationAddress,
    getImplementationAddressFromBeacon,
    getStorageLayoutForAddress,
    Manifest,
    processProxyKind,
    ValidationOptions,
} from '@openzeppelin/upgrades-core';
import { DeployData } from '../deploy-impl';

async function processProxyImpl(deployData: DeployData, proxyAddress: string | undefined, opts: ValidationOptions) {
    await processProxyKind(deployData.provider, proxyAddress, opts, deployData.validations, deployData.version);

    let currentImplAddress: string | undefined;
    if (proxyAddress !== undefined) {
        // upgrade scenario

        // FIXME: Figure out how to get the current implementation address on the local setup
        currentImplAddress = await getImplementationAddress(deployData.provider, proxyAddress);
        // currentImplAddress = '0xd5608cEC132ED4875D19f8d815EC2ac58498B4E5';
    }
    return currentImplAddress;
}

async function processBeaconImpl(deployData: DeployData, beaconAddress: string) {
    // upgrade scenario
    await assertNotProxy(deployData.provider, beaconAddress);
    return await getImplementationAddressFromBeacon(deployData.provider, beaconAddress);
}

export async function validateImpl(
    deployData: DeployData,
    opts: ValidationOptions,
    currentImplAddress?: string
): Promise<void> {
    assertUpgradeSafe(deployData.validations, deployData.version, deployData.fullOpts);

    if (currentImplAddress !== undefined) {
        const manifest = await Manifest.forNetwork(deployData.provider);
        const currentLayout = await getStorageLayoutForAddress(manifest, deployData.validations, currentImplAddress);
        if (opts.unsafeSkipStorageCheck !== true) {
            assertStorageUpgradeSafe(currentLayout, deployData.layout, deployData.fullOpts);
        }
    }
}

export async function validateProxyImpl(
    deployData: DeployData,
    opts: ValidationOptions,
    proxyAddress?: string
): Promise<void> {
    // FIXME: Figure out how to get the current implementation address on the zkSync network
    const currentImplAddress = await processProxyImpl(deployData, proxyAddress, opts);
    // const currentImplAddress = '0x40BF2f4900d62d7509B9DDF3A9c28Ecc9E91716B';
    return validateImpl(deployData, opts, currentImplAddress);
}

export async function validateBeaconImpl(
    deployData: DeployData,
    opts: ValidationOptions,
    beaconAddress?: string
): Promise<void> {
    const currentImplAddress =
        beaconAddress !== undefined ? await processBeaconImpl(deployData, beaconAddress) : undefined;
    return validateImpl(deployData, opts, currentImplAddress);
}
