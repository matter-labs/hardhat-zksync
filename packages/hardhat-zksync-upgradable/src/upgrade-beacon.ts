import { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { ContractFactory, Contract } from 'ethers';
import { ContractAddressOrInstance, getContractAddress } from './contract-types';
import { UpgradeBeaconOptions } from './options';
import { deployBeaconImpl } from './deploy-impl';
import { getUpgradeableBeaconFactory } from './utils/factories';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import * as zk from 'zksync-web3';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

// import {
//     getContractAddress,
//     ContractAddressOrInstance,
//     getUpgradeableBeaconFactory,
//     deployBeaconImpl,
//     UpgradeBeaconOptions,
// } from './utils';

export type UpgradeBeaconFunction = (
    beacon: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    ImplFactory: zk.ContractFactory,
    deployer: Deployer,
    opts?: UpgradeBeaconOptions
) => Promise<Contract>;

export function makeUpgradeBeacon(hre: HardhatRuntimeEnvironment): UpgradeBeaconFunction {
    return async function upgradeBeacon(beacon, artifact, ImplFactory, deployer, opts: UpgradeBeaconOptions = {}) {
        const beaconAddress = getContractAddress(beacon);
        const { impl: nextImpl } = await deployBeaconImpl(hre, artifact, ImplFactory, deployer, opts, beaconAddress);

        const UpgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre, ImplFactory.signer);
        const beaconContract = UpgradeableBeaconFactory.attach(beaconAddress);
        const upgradeTx = await beaconContract.upgradeTo(nextImpl);

        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = upgradeTx;
        return beaconContract;
    };
}
