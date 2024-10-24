import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as ethers from 'ethers';
import chalk from 'chalk';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { convertGasPriceToEth, getInitializerData } from '../utils/utils-general';

import { getChainId } from '../core/provider';
import { getProxyAdminArtifact, getUpgradableBeaconArtifact } from '../utils/factories';

export type EstimateGasFunction = (
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    args?: DeployProxyOptions[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<bigint>;

export async function getMockedBeaconData(
    deployer: Deployer,
    hre: HardhatRuntimeEnvironment,
    args: DeployProxyOptions[],
    opts: DeployProxyOptions,
): Promise<{ mockedBeaconAddress: string; data: string }> {
    const chainId = await getChainId(deployer.zkWallet.provider);

    if (!chainId) {
        throw new ZkSyncUpgradablePluginError(`Chain id ${chainId} is not supported!`);
    }

    const mockedBeaconAddress = await getDeployedBeaconAddress(deployer);
    const mockArtifact = await getProxyAdminArtifact(hre);
    const data = getInitializerData(new ethers.Interface(mockArtifact.abi), args, opts.initializer);

    return { mockedBeaconAddress, data };
}

async function getDeployedBeaconAddress(deployer: Deployer) {
    const defaultBridgeAddresses = await deployer.zkWallet.provider.getDefaultBridgeAddresses();
    const sharedBridgeL2Contract = new ethers.Contract(
        defaultBridgeAddresses.sharedL2,
        ['function l2TokenBeacon() public view returns (address)'],
        deployer.zkWallet.provider,
    );
    const beaconAddress = await sharedBridgeL2Contract.l2TokenBeacon();
    return beaconAddress;
}

export function makeEstimateGasBeacon(hre: HardhatRuntimeEnvironment): EstimateGasFunction {
    return async function estimateGasBeacon(
        deployer: Deployer,
        artifact: ZkSyncArtifact,
        args: DeployProxyOptions[] = [],
        opts: DeployProxyOptions = {},
        quiet = false,
    ) {
        let beaconGasCost: bigint = 0n;

        const { mockedBeaconAddress } = await getMockedBeaconData(deployer, hre, args, opts);

        const implGasCost: bigint = await deployer.estimateDeployFee(artifact, []);
        if (!quiet) {
            console.info(
                chalk.cyan(
                    `Deployment of the implementation contract is estimated to cost: ${convertGasPriceToEth(
                        implGasCost,
                    )} ETH`,
                ),
            );
        }
        const upgradeableBeaconContract = await getUpgradableBeaconArtifact(hre);

        try {
            beaconGasCost = await deployer.estimateDeployFee(upgradeableBeaconContract, [
                mockedBeaconAddress,
                opts.initialOwner ?? deployer.zkWallet.address,
            ]);
            if (!quiet) {
                console.info(
                    chalk.cyan(
                        `Deployment of the upgradeable beacon contract is estimated to cost: ${convertGasPriceToEth(
                            beaconGasCost,
                        )} ETH`,
                    ),
                );
                console.info(
                    chalk.cyan(`Total estimated gas cost: ${convertGasPriceToEth(implGasCost + beaconGasCost)} ETH`),
                );
            }
        } catch (error: any) {
            throw new ZkSyncUpgradablePluginError(`Error estimating gas cost: ${error.reason}`);
        }
        return beaconGasCost + implGasCost;
    };
}
