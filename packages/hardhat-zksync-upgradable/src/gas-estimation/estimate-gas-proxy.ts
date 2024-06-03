import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import * as ethers from 'ethers';
import chalk from 'chalk';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';

import { ZkSyncUpgradablePluginError } from '../errors';
import { DeployProxyOptions } from '../utils/options';
import { convertGasPriceToEth, getInitializerData } from '../utils/utils-general';
import { getChainId } from '../core/provider';
import { defaultImplAddresses } from '../constants';

import { deploy } from '../proxy-deployment/deploy';
import {
    getProxyAdminArtifact,
    getProxyAdminFactory,
    getProxyArtifact,
    getTransparentUpgradeableProxyArtifact,
} from '../utils/factories';

export type EstimateProxyGasFunction = (
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    args?: DeployProxyOptions[],
    opts?: DeployProxyOptions,
    quiet?: boolean,
) => Promise<ethers.BigNumber>;
interface GasCosts {
    adminGasCost: ethers.BigNumber;
    proxyGasCost: ethers.BigNumber;
}

async function deployProxyAdminLocally(adminFactory: zk.ContractFactory, ...args: any[]) {
    const mockContract = await deploy(adminFactory, ...args);
    return mockContract.address;
}

export function makeEstimateGasProxy(hre: HardhatRuntimeEnvironment): EstimateProxyGasFunction {
    return async function estimateGasProxy(
        deployer: Deployer,
        artifact: ZkSyncArtifact,
        args: DeployProxyOptions[] = [],
        opts: DeployProxyOptions = {},
        quiet: boolean = false,
    ) {
        let data;
        let totalGasCost;
        let mockImplAddress: string;

        const mockArtifact = await getProxyAdminArtifact(hre);
        const kind = opts.kind;

        const chainId = await getChainId(deployer.zkWallet.provider);

        if (!chainId) {
            throw new ZkSyncUpgradablePluginError(`Chain id ${chainId} is not supported!`);
        }

        const initialOwner = opts.initialOwner ?? deployer.zkWallet.address;
        if (chainId === 270) {
            const adminFactory = await getProxyAdminFactory(hre, deployer.zkWallet);
            mockImplAddress = await deployProxyAdminLocally(adminFactory, initialOwner);
            data = getInitializerData(adminFactory.interface, args, opts.initializer);
        } else {
            mockImplAddress = defaultImplAddresses[chainId].contractAddress;
            data = getInitializerData(ethers.Contract.getInterface(mockArtifact.abi), args, opts.initializer);
        }

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

        switch (kind) {
            case 'beacon': {
                throw new ZkSyncUpgradablePluginError(`Beacon proxy is not supported!`);
            }

            case 'uups': {
                const uupsGasCost = await estimateGasUUPS(hre, deployer, mockImplAddress, data, quiet);
                totalGasCost = implGasCost.add(uupsGasCost);
                break;
            }

            case 'transparent': {
                const { adminGasCost, proxyGasCost } = await estimateGasTransparent(
                    hre,
                    deployer,
                    mockImplAddress,
                    data,
                    initialOwner,
                    quiet,
                );
                totalGasCost = implGasCost.add(adminGasCost).add(proxyGasCost);
                break;
            }

            default: {
                throw new ZkSyncUpgradablePluginError(`Unknown proxy kind: ${kind}`);
            }
        }

        if (!quiet) {
            console.info(
                chalk.cyan(`Total deployment cost is estimated to cost: ${convertGasPriceToEth(totalGasCost)} ETH`),
            );
        }
        return totalGasCost;
    };
}

async function estimateGasUUPS(
    hre: HardhatRuntimeEnvironment,
    deployer: Deployer,
    mockImplAddress: string,
    data: string,
    quiet: boolean = false,
): Promise<ethers.BigNumber> {
    const proxyContract = await getProxyArtifact(hre);

    try {
        const uupsGasCost = await deployer.estimateDeployFee(proxyContract, [mockImplAddress, data]);
        if (!quiet) {
            console.info(
                chalk.cyan(
                    `Deployment of the UUPS proxy contract is estimated to cost: ${convertGasPriceToEth(
                        uupsGasCost,
                    )} ETH`,
                ),
            );
        }
        return uupsGasCost;
    } catch (error: any) {
        throw new ZkSyncUpgradablePluginError(`Error estimating gas cost: ${error.reason}`);
    }
}

async function estimateGasTransparent(
    hre: HardhatRuntimeEnvironment,
    deployer: Deployer,
    mockImplAddress: string,
    data: string,
    initialOwner?: string,
    quiet: boolean = false,
): Promise<GasCosts> {
    const adminArtifact = await getProxyAdminArtifact(hre);
    const adminGasCost = await deployer.estimateDeployFee(adminArtifact, [initialOwner ?? deployer.zkWallet.address]);
    let proxyGasCost;
    if (!quiet) {
        console.info(
            chalk.cyan(
                `Deployment of the admin proxy contract is estimated to cost: ${convertGasPriceToEth(
                    adminGasCost,
                )} ETH`,
            ),
        );
    }

    const TUPContract = await getTransparentUpgradeableProxyArtifact(hre);

    try {
        proxyGasCost = await deployer.estimateDeployFee(TUPContract, [
            mockImplAddress,
            initialOwner ?? deployer.zkWallet.address,
            data,
        ]);
        if (!quiet) {
            console.info(
                chalk.cyan(
                    `Deployment of the transparent proxy contract is estimated to cost: ${convertGasPriceToEth(
                        proxyGasCost,
                    )} ETH`,
                ),
            );
        }
    } catch (error: any) {
        throw new ZkSyncUpgradablePluginError(`Error estimating gas cost: ${error.reason}`);
    }

    return { adminGasCost, proxyGasCost };
}
