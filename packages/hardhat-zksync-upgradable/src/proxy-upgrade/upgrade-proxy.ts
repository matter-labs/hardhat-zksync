import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { TransactionResponse } from 'zksync-ethers/src/types';

import { getAdminAddress, getCode, getUpgradeInterfaceVersion, isEmptySlot } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';

import { ContractAddressOrInstance } from '../interfaces';
import { UpgradeProxyOptions } from '../utils/options';
import { extractFactoryDeps, getContractAddress } from '../utils/utils-general';
import { deployProxyImpl } from '../proxy-deployment/deploy-impl';
import {
    attachITransparentUpgradeableProxyV4,
    attachITransparentUpgradeableProxyV5,
    attachProxyAdminV4,
    attachProxyAdminV5,
} from '../utils/attach-abi';

export type UpgradeFunction = (
    wallet: zk.Wallet,
    proxy: ContractAddressOrInstance,
    artifact: ZkSyncArtifact,
    opts?: UpgradeProxyOptions,
    quiet?: boolean,
) => Promise<zk.Contract>;

export function makeUpgradeProxy(hre: HardhatRuntimeEnvironment): UpgradeFunction {
    return async function upgradeProxy(
        wallet,
        proxy,
        newImplementationArtifact,
        opts: UpgradeProxyOptions = {},
        quiet: boolean = false,
    ): Promise<zk.Contract> {
        const proxyAddress = await getContractAddress(proxy);
        opts.provider = wallet.provider;
        opts.factoryDeps = await extractFactoryDeps(hre, newImplementationArtifact);

        const newImplementationFactory = new zk.ContractFactory<any[], zk.Contract>(
            newImplementationArtifact.abi,
            newImplementationArtifact.bytecode,
            wallet,
            opts.deploymentType,
        );
        const { impl: nextImpl } = await deployProxyImpl(hre, newImplementationFactory, opts, proxyAddress);

        const upgradeTo = await getUpgrader(proxyAddress, wallet);
        const call = encodeCall(newImplementationFactory, opts.call);
        const upgradeTx = await upgradeTo(nextImpl, call);

        if (!quiet) {
            console.info(chalk.green(`Contract successfully upgraded to ${nextImpl} with tx ${upgradeTx.hash}`));
        }

        const inst = newImplementationFactory.attach(proxyAddress);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = upgradeTx;
        return inst;
    };

    type Upgrader = (nextImpl: string, call?: string) => Promise<TransactionResponse>;

    async function getUpgrader(proxyAddress: string, wallet: zk.Wallet): Promise<Upgrader> {
        const provider = wallet.provider as zk.Provider;

        const adminAddress = await getAdminAddress(provider, proxyAddress);
        const adminBytecode = await getCode(provider, adminAddress);

        if (isEmptySlot(adminAddress) || adminBytecode === '0x') {
            const upgradeInterfaceVersion = await getUpgradeInterfaceVersion(provider, proxyAddress);
            if (upgradeInterfaceVersion === '5.0.0') {
                const proxyV5 = await attachITransparentUpgradeableProxyV5(proxyAddress, wallet);

                return (nextImpl, call) => proxyV5.upgradeToAndCall(nextImpl, call ?? '0x');
            }

            if (upgradeInterfaceVersion !== undefined) {
                // Log as debug if the interface version is an unknown string.
                // Do not throw an error because this could be caused by a fallback function.
                console.debug(
                    `Unknown UPGRADE_INTERFACE_VERSION ${upgradeInterfaceVersion} for proxy at ${proxyAddress}. Expected 5.0.0`,
                );
            }
            const proxyV4 = await attachITransparentUpgradeableProxyV4(proxyAddress, wallet);
            return (nextImpl, call) => (call ? proxyV4.upgradeToAndCall(nextImpl, call) : proxyV4.upgradeTo(nextImpl));
        } else {
            const upgradeInterfaceVersion = await getUpgradeInterfaceVersion(provider, adminAddress);

            if (upgradeInterfaceVersion === '5.0.0') {
                const adminV5 = await attachProxyAdminV5(adminAddress, wallet);

                return (nextImpl, call) => adminV5.upgradeAndCall(proxyAddress, nextImpl, call ?? '0x');
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
                call ? adminV4.upgradeAndCall(proxyAddress, nextImpl, call) : adminV4.upgrade(proxyAddress, nextImpl);
        }
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
