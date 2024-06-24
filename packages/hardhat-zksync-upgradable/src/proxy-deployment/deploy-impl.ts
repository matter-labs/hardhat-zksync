import {
    getStorageLayout,
    getVersion,
    StorageLayout,
    ValidationDataCurrent,
    Version,
} from '@openzeppelin/upgrades-core';

import * as zk from 'zksync-ethers';
import type { HardhatRuntimeEnvironment } from 'hardhat/types';

import { TransactionResponse } from 'zksync-ethers/src/types';
import { DeployProxyOptions, UpgradeOptions, withDefaults } from '../utils/options';
import { validateBeaconImpl, validateProxyImpl } from '../validations/validate-impl';
import { readValidations } from '../validations/validations';

import { fetchOrDeployGetDeployment } from '../core/impl-store';
import { FORMAT_TYPE_MINIMAL, IMPL_CONTRACT_NOT_DEPLOYED_ERROR } from '../constants';
import { ZkSyncUpgradablePluginError } from '../errors';
import { deploy } from './deploy';

export interface DeployData {
    provider: zk.Provider;
    validations: ValidationDataCurrent;
    unlinkedBytecode: string;
    encodedArgs: string;
    version: Version;
    layout: StorageLayout;
    fullOpts: Required<UpgradeOptions>;
}

export async function getDeployData(
    hre: HardhatRuntimeEnvironment,
    contractFactory: zk.ContractFactory,
    opts: UpgradeOptions,
): Promise<DeployData> {
    const provider = opts.provider;
    const validations = await readValidations(hre);
    const unlinkedBytecode = contractFactory.bytecode;
    const encodedArgs = contractFactory.interface.encodeDeploy(opts.constructorArgs);
    const version = getVersion(unlinkedBytecode, contractFactory.bytecode, encodedArgs);
    const layout = getStorageLayout(validations, version);
    const fullOpts = withDefaults(opts);
    return {
        provider,
        validations,
        unlinkedBytecode,
        encodedArgs,
        version,
        layout,
        fullOpts,
    };
}

export async function deployProxyImpl(
    hre: HardhatRuntimeEnvironment,
    contractFactory: zk.ContractFactory,
    opts: DeployProxyOptions,
    proxyAddress?: string,
): Promise<any> {
    const deployData = await getDeployData(hre, contractFactory, opts);
    await validateProxyImpl(deployData, opts, proxyAddress);
    return await deployImpl(hre, deployData, contractFactory, opts);
}

async function deployImpl<TRequiredSeperateForProxy extends boolean | undefined>(
    hre: HardhatRuntimeEnvironment,
    deployData: DeployData,
    factory: zk.ContractFactory,
    opts: UpgradeOptions<TRequiredSeperateForProxy>,
): Promise<any> {
    const layout = deployData.layout;

    const deployment = await fetchOrDeployGetDeployment(
        deployData.version,
        deployData.provider,
        async () => {
            const abi = factory.interface.format(FORMAT_TYPE_MINIMAL === 'minimal') as string[];
            const attemptDeploy = async () => {
                if (opts.useDeployedImplementation) {
                    throw new ZkSyncUpgradablePluginError(IMPL_CONTRACT_NOT_DEPLOYED_ERROR);
                } else {
                    const deployed = await deploy(
                        factory,
                        ...[
                            ...deployData.fullOpts.constructorArgs,
                            {
                                customData: {
                                    factoryDeps: deployData.fullOpts.factoryDeps,
                                    salt:
                                        'salt' in opts
                                            ? (opts as UpgradeOptions<false>).salt
                                            : (opts as UpgradeOptions).saltImpl,
                                },
                            },
                        ],
                    );
                    return deployed;
                }
            };
            const deploymentInternal = { abi, ...(await attemptDeploy()) };
            return { ...deploymentInternal, layout };
        },
        opts,
    );

    return { impl: deployment.address, kind: opts.kind };
}

interface DeployedBeaconImpl {
    impl: string;
    txResponse?: TransactionResponse;
}

export async function deployBeaconImpl(
    hre: HardhatRuntimeEnvironment,
    factory: zk.ContractFactory,
    opts: UpgradeOptions,
    beaconAddress?: string,
): Promise<DeployedBeaconImpl> {
    const deployData = await getDeployData(hre, factory, opts);
    await validateBeaconImpl(deployData, opts, beaconAddress);
    return await deployImpl(hre, deployData, factory, opts);
}
