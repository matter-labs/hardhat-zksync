import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import chalk from 'chalk';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { DeployProxyOptions } from '../utils/options';
import { ZkSyncUpgradablePluginError } from '../errors';
import { convertGasPriceToEth, getInitializerData } from '../utils/utils-general';
import { defaultImplAddresses } from '../constants';

import { getChainId } from '../core/provider';
import { deploy } from '../proxy-deployment/deploy';
import {
    getProxyAdminArtifact,
    getProxyAdminFactory,
    getUpgradableBeaconArtifact,
    getUpgradeableBeaconFactory,
} from '../utils/factories';

export type EstimateGasFunction = (
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    args?: DeployProxyOptions[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<ethers.BigNumber>;

async function deployProxyAdminLocally(adminFactory: zk.ContractFactory, ...args: any[]) {
    const mockContract = await deploy(adminFactory, ...args);
    return mockContract.address;
}

async function deployBeaconLocally(
    impl: string,
    initialOwner: string,
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
) {
    const upgradeableBeaconFactory = await getUpgradeableBeaconFactory(hre, wallet);

    return await deploy(upgradeableBeaconFactory, impl, initialOwner);
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

    const initialOwner = opts.initialOwner ?? deployer.zkWallet.address;

    if (chainId === 270) {
        const adminFactory = await getProxyAdminFactory(hre, deployer.zkWallet);
        mockImplAddress = await deployProxyAdminLocally(adminFactory, initialOwner);
        mockedBeaconAddress = (await deployBeaconLocally(mockImplAddress, initialOwner, hre, deployer.zkWallet))
            .address;
        data = getInitializerData(adminFactory.interface, args, opts.initializer);
    } else {
        mockedBeaconAddress = defaultImplAddresses[chainId].beacon;
        const mockArtifact = await getProxyAdminArtifact(hre);
        data = getInitializerData(ethers.Contract.getInterface(mockArtifact.abi), args, opts.initializer);
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
        let beaconGasCost = ethers.BigNumber.from(0);

        const { mockedBeaconAddress } = await getMockedBeaconData(deployer, hre, args, opts);

        const implGasCost = await deployer.estimateDeployFee(artifact, []);
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
                    chalk.cyan(`Total estimated gas cost: ${convertGasPriceToEth(implGasCost.add(beaconGasCost))} ETH`),
                );
            }
        } catch (error: any) {
            throw new ZkSyncUpgradablePluginError(`Error estimating gas cost: ${error.reason}`);
        }
        return beaconGasCost.add(implGasCost);
    };
}
