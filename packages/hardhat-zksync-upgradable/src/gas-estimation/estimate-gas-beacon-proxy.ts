import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { convertGasPriceToEth } from '../utils/utils-general';

import { getBeaconProxyArtifact } from '../utils/factories';
import { getMockedBeaconData } from './estimate-gas-beacon';

export type EstimateBeaconGasFunction = (
    deployer: Deployer,
    args?: DeployProxyOptions[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<bigint>;

export function makeEstimateGasBeaconProxy(hre: HardhatRuntimeEnvironment): EstimateBeaconGasFunction {
    return async function estimateGasBeaconProxy(
        deployer: Deployer,
        args: DeployProxyOptions[] = [],
        opts: DeployProxyOptions = {},
        quiet: boolean = false,
    ) {
        const { mockedBeaconAddress, data } = await getMockedBeaconData(deployer, hre, args, opts);

        const beaconProxyContract = await getBeaconProxyArtifact(hre);

        try {
            const beaconProxyGasCost = await deployer.estimateDeployFee(beaconProxyContract, [
                mockedBeaconAddress,
                data,
            ]);
            if (!quiet) {
                console.info(
                    chalk.cyan(
                        `Deployment of the beacon proxy contract is estimated to cost: ${convertGasPriceToEth(
                            beaconProxyGasCost,
                        )} ETH`,
                    ),
                );
                console.info(chalk.cyan(`Total estimated gas cost: ${convertGasPriceToEth(beaconProxyGasCost)} ETH`));
            }
            return beaconProxyGasCost;
        } catch (error: any) {
            throw new ZkSyncUpgradablePluginError(`Error estimating gas cost: ${error.reason}`);
        }
    };
}
