
import {
    getTransactionByHash,
    getImplementationAddress,
    getBeaconAddress,
    getImplementationAddressFromBeacon,
    UpgradesError,
    getAdminAddress,
    isTransparentOrUUPSProxy,
    isBeacon,
    isBeaconProxy,
    isEmptySlot,
  } from '@openzeppelin/upgrades-core';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

//FIXME: don't import verifiableContracts from verify-proxy.ts
import { linkProxyWithImplementationAbi, verifiableContracts, verifyWithArtifactOrFallback } from './verify-proxy';


/**
 * Verifies all contracts resulting from a beacon deployment: implementation, beacon
 *
 * @param hre
 * @param beaconAddress The beacon address
 * @param hardhatVerify A function that invokes the hardhat-etherscan plugin's verify command
 * @param etherscanApi Configuration for the Etherscan API
 * @param errorReport Accumulated verification errors
 */
export async function fullVerifyBeacon(
    hre: HardhatRuntimeEnvironment,
    beaconAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
  ) {
    const provider = hre.network.provider;
  
    const implAddress = await getImplementationAddressFromBeacon(provider, beaconAddress);
    await verifyImplementation(hardhatVerify, implAddress);
    await verifyBeacon();
  
    async function verifyBeacon() {
      console.log(`Verifying beacon or beacon-like contract: ${beaconAddress}`);
      await verifyWithArtifactOrFallback(
        hre,
        hardhatVerify,
        beaconAddress,
        [verifiableContracts.upgradeableBeacon],
        true,
      );
    }
  }



/**
 * Fully verifies all contracts related to the given beacon proxy address: implementation, beacon, and beacon proxy.
 * Also links the proxy to the implementation ABI on Etherscan.
 *
 * @param hre
 * @param proxyAddress The beacon proxy address
 * @param hardhatVerify A function that invokes the hardhat-etherscan plugin's verify command
 * @param errorReport Accumulated verification errors
 */
export async function fullVerifyBeaconProxy(
    hre: HardhatRuntimeEnvironment,
    proxyAddress: any,
    hardhatVerify: (address: string) => Promise<any>,
  ) {
    const provider = hre.network.provider;
    const beaconAddress = await getBeaconAddress(provider, proxyAddress);
    const implAddress = await getImplementationAddressFromBeacon(provider, beaconAddress);
  
    await fullVerifyBeacon(hre, beaconAddress, hardhatVerify);
    await verifyBeaconProxy();
    await linkProxyWithImplementationAbi(proxyAddress, implAddress);
  
    async function verifyBeaconProxy() {
      console.log(`Verifying beacon proxy: ${proxyAddress}`);
      await verifyWithArtifactOrFallback(
        hre,
        hardhatVerify,
        proxyAddress,
        [verifiableContracts.beaconProxy],
        true,
      );
    }
  }
  