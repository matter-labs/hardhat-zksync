import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-web3';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { ContractAddressOrInstance, importProxyContract } from '../utils/utils-general';
import { UpgradeBeaconOptions } from '../utils/options';
import { deployBeaconImpl } from '../proxy-deployment/deploy-impl';
import { getContractAddress } from '../utils/utils-general';
import { UPGRADABLE_BEACON_JSON } from '../constants';

export type UpgradeBeaconFunction = (
    wallet: zk.Wallet,
    artifact: ZkSyncArtifact,
    beacon: ContractAddressOrInstance,
    opts?: UpgradeBeaconOptions
) => Promise<zk.Contract>;

export function makeUpgradeBeacon(hre: HardhatRuntimeEnvironment): UpgradeBeaconFunction {
    return async function upgradeBeacon(wallet, artifact, boxV2Implementation, opts: UpgradeBeaconOptions = {}) {
        const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);

        opts.provider = wallet.provider;
        const beaconImplementationAddress = getContractAddress(boxV2Implementation);
        const { impl: nextImpl } = await deployBeaconImpl(hre, factory, opts, beaconImplementationAddress);
        console.log('New beacon impl deployed at', nextImpl);

        const upgradeableBeaconContract = await importProxyContract(
            '..',
            hre.config.zksolc.version,
            UPGRADABLE_BEACON_JSON
        );
        const upgradeableBeaconFactory = new zk.ContractFactory(
            upgradeableBeaconContract.abi,
            upgradeableBeaconContract.bytecode,
            wallet
        );

        const beaconContract = upgradeableBeaconFactory.attach(beaconImplementationAddress);
        const upgradeTx = await beaconContract.upgradeTo(nextImpl);

        // @ts-ignore Won't be readonly because beaconContract was created through attach.
        beaconContract.deployTransaction = upgradeTx;
        return beaconContract;
    };
}
