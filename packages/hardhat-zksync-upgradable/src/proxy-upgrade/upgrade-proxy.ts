import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { TransactionResponse } from 'zksync-ethers/src/types';
import { getAdminAddress, getCode, getUpgradeInterfaceVersion, isEmptySlot } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';
import { ContractAddressOrInstance } from '../interfaces';
import { UpgradeProxyOptions } from '../utils/options';
import { extractFactoryDeps, getArtifactFromBytecode, getContractAddress } from '../utils/utils-general';
import { deployProxyImpl } from '../proxy-deployment/deploy-impl';
import { ZkSyncUpgradablePluginError } from '../errors';
import {
    attachITransparentUpgradeableProxyV4,
    attachITransparentUpgradeableProxyV5,
    attachProxyAdminV4,
    attachProxyAdminV5,
} from '../utils/attach-abi';

export type UpgradeProxyFactory = (
    proxy: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    opts?: UpgradeProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export type UpgradeProxyArtifact = (
    wallet: zk.Wallet,
    proxy: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

type Upgrader = (nextImpl: string, call?: string) => Promise<TransactionResponse>;

export function makeUpgradeProxy(hre: HardhatRuntimeEnvironment): UpgradeProxyFactory | UpgradeProxyArtifact {
    return async function (...args: Parameters<UpgradeProxyFactory | UpgradeProxyArtifact>): Promise<zk.Contract> {
        const target = args[1];
        if (target instanceof zk.ContractFactory) {
            return await upgradeProxyFactory(hre, ...(args as Parameters<UpgradeProxyFactory>));
        } else {
            return upgradeProxyArtifact(hre, ...(args as Parameters<UpgradeProxyArtifact>));
        }
    };
}

export async function upgradeProxyFactory(
    hre: HardhatRuntimeEnvironment,
    proxy: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    opts?: UpgradeProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const wallet = factory.runner && 'getAddress' in factory.runner ? (factory.runner as zk.Wallet) : undefined;
    if (!wallet) {
        throw new ZkSyncUpgradablePluginError('Wallet is required for upgrade.');
    }

    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, await getArtifactFromBytecode(hre, factory.bytecode));
    return upgradeProxy(hre, wallet, proxy, factory, opts, quiet);
}

export async function upgradeProxyArtifact(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    proxy: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeProxyOptions,
    quiet?: boolean,
): Promise<zk.Contract> {
    const factory = new zk.ContractFactory(artifact.abi, artifact.bytecode, wallet);
    opts = opts || {};
    opts.provider = wallet.provider;
    opts.factoryDeps = await extractFactoryDeps(hre, artifact as ZkSyncArtifact);
    return upgradeProxy(hre, wallet, proxy, factory, opts, quiet);
}

async function upgradeProxy(
    hre: HardhatRuntimeEnvironment,
    wallet: zk.Wallet,
    proxy: ContractAddressOrInstance,
    factory: zk.ContractFactory,
    opts: UpgradeProxyOptions = {},
    quiet: boolean = false,
) {
    const proxyAddress = await getContractAddress(proxy);

    const { impl: nextImpl } = await deployProxyImpl(hre, factory, opts, proxyAddress);

    const upgradeTo = await getUpgrader(hre, proxyAddress, wallet, opts);
    const call = encodeCall(factory, opts.call);
    const upgradeTx = await upgradeTo(nextImpl, call);

    if (!quiet) {
        console.info(chalk.green(`Contract successfully upgraded to ${nextImpl} with tx ${upgradeTx.hash}`));
    }

    const inst = factory.attach(proxyAddress);
    // @ts-ignore Won't be readonly because inst was created through attach.
    inst.deployTransaction = upgradeTx;
    return inst as zk.Contract;
}

async function getUpgrader(
    hre: HardhatRuntimeEnvironment,
    proxyAddress: string,
    wallet: zk.Wallet,
    opts?: UpgradeProxyOptions,
): Promise<Upgrader> {
    const provider = wallet.provider as zk.Provider;

    const adminAddress = await getAdminAddress(provider, proxyAddress);
    const adminBytecode = await getCode(provider, adminAddress);

    if (isEmptySlot(adminAddress) || adminBytecode === '0x') {
        const upgradeInterfaceVersion = await getUpgradeInterfaceVersion(provider, proxyAddress);
        if (upgradeInterfaceVersion === '5.0.0') {
            const proxyV5 = await attachITransparentUpgradeableProxyV5(proxyAddress, wallet);
            return (nextImpl, call) =>
                proxyV5.upgradeToAndCall(nextImpl, call ?? '0x', {
                    customData: {
                        paymasterParams: opts?.paymasterParams,
                    },
                });
        }
        if (upgradeInterfaceVersion !== undefined) {
            // Log as debug if the interface version is an unknown string.
            // Do not throw an error because this could be caused by a fallback function.
            console.debug(
                `Unknown UPGRADE_INTERFACE_VERSION ${upgradeInterfaceVersion} for proxy at ${proxyAddress}. Expected 5.0.0`,
            );
        }
        const proxyV4 = await attachITransparentUpgradeableProxyV4(proxyAddress, wallet);
        return (nextImpl, call) =>
            call
                ? proxyV4.upgradeToAndCall(nextImpl, call, {
                      customData: {
                          paymasterParams: opts?.paymasterParams,
                      },
                  })
                : proxyV4.upgradeTo(nextImpl, {
                      customData: {
                          paymasterParams: opts?.paymasterParams,
                      },
                  });
    } else {
        const upgradeInterfaceVersion = await getUpgradeInterfaceVersion(provider, adminAddress);

        if (upgradeInterfaceVersion === '5.0.0') {
            const adminV5 = await attachProxyAdminV5(adminAddress, wallet);
            return (nextImpl, call) =>
                adminV5.upgradeAndCall(proxyAddress, nextImpl, call ?? '0x', {
                    customData: {
                        paymasterParams: opts?.paymasterParams,
                    },
                });
        }
        if (upgradeInterfaceVersion !== undefined) {
            // Log as debug if the interface version is an unknown string.
            // Do not throw an error because this could be caused by a fallback function.
            console.debug(
                `Unknown UPGRADE_INTERFACE_VERSION ${upgradeInterfaceVersion} for proxy at ${proxyAddress}. Expected 5.0.0`,
            );
        }
        const adminV4 = await attachProxyAdminV4(adminAddress, wallet);
        return (nextImpl, call) =>
            call
                ? adminV4.upgradeAndCall(proxyAddress, nextImpl, call, {
                      customData: {
                          paymasterParams: opts?.paymasterParams,
                      },
                  })
                : adminV4.upgrade(proxyAddress, nextImpl, {
                      customData: {
                          paymasterParams: opts?.paymasterParams,
                      },
                  });
    }
}

function encodeCall(factory: zk.ContractFactory, call: UpgradeProxyOptions['call']): string | undefined {
    if (!call) {
        return undefined;
    }

    if (typeof call === 'string') {
        call = { fn: call };
    }

    return factory.interface.encodeFunctionData(call.fn, call.args ?? []);
}
