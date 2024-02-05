import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import chalk from 'chalk';
import assert from 'assert';
import path from 'path';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { convertGasPriceToEth, getInitializerData } from '../utils/utils-general';
import { UPGRADABLE_BEACON_JSON, defaultImplAddresses } from '../constants';

import { getAdminArtifact, getAdminFactory } from '../proxy-deployment/deploy-proxy-admin';
import { getChainId } from '../core/provider';
import { deploy } from '../proxy-deployment/deploy';

export type EstimateGasFunction = (
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    args?: DeployProxyOptions[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<bigint>;

async function deployProxyAdminLocally(adminFactory: zk.ContractFactory) {
    const mockContract = await deploy(adminFactory);
    return mockContract.address;
}

async function deployBeaconLocally(impl: string, hre: HardhatRuntimeEnvironment, wallet: zk.Wallet) {
    const upgradableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + UPGRADABLE_BEACON_JSON),
    );
    assert(upgradableBeaconPath, 'Upgradable beacon artifact not found');
    const upgradeableBeaconContract = await import(upgradableBeaconPath);

    const upgradeableBeaconFactory = new zk.ContractFactory(
        upgradeableBeaconContract.abi,
        upgradeableBeaconContract.bytecode,
        wallet,
    );
    return await deploy(upgradeableBeaconFactory, impl);
}

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

    let mockedBeaconAddress: string;
    let mockImplAddress: string;
    let data: string;

    if (chainId === 270) {
        const adminFactory = await getAdminFactory(hre, deployer.zkWallet);
        mockImplAddress = await deployProxyAdminLocally(adminFactory);
        mockedBeaconAddress = (await deployBeaconLocally(mockImplAddress, hre, deployer.zkWallet)).address;
        data = getInitializerData(adminFactory.interface, args, opts.initializer);
    } else {
        mockedBeaconAddress = defaultImplAddresses[chainId].beacon;
        const mockArtifact = await getAdminArtifact(hre);
        data = getInitializerData(new ethers.Interface(mockArtifact.abi), args, opts.initializer);
    }

    return { mockedBeaconAddress, data };
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

        const upgradableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
            x.includes(path.sep + UPGRADABLE_BEACON_JSON),
        );
        assert(upgradableBeaconPath, 'Upgradable beacon artifact not found');
        const upgradeableBeaconContract = await import(upgradableBeaconPath);

        try {
            beaconGasCost = await deployer.estimateDeployFee(upgradeableBeaconContract, [mockedBeaconAddress]);
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
