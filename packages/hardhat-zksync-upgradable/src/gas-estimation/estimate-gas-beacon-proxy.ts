import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import chalk from 'chalk';
import assert from 'assert';
import path from 'path';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { convertGasPriceToEth } from '../utils/utils-general';
import { BEACON_PROXY_JSON } from '../constants';

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

        const beaconProxyPath = (await hre.artifacts.getArtifactPaths()).find((artifactPath) =>
            artifactPath.includes(path.sep + BEACON_PROXY_JSON),
        );
        assert(beaconProxyPath, 'Beacon proxy artifact not found');
        const beaconProxyContract = await import(beaconProxyPath);

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
