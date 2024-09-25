import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as zk from 'zksync-ethers';
import { TransactionResponse } from 'zksync-ethers/src/types';
import path from 'path';
import { getAdminAddress, getCode, isEmptySlot } from '@openzeppelin/upgrades-core';

import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import chalk from 'chalk';
import assert from 'assert';
import { ContractAddressOrInstance } from '../interfaces';
import { UpgradeProxyOptions } from '../utils/options';
import { extractFactoryDeps, getArtifactFromBytecode, getContractAddress } from '../utils/utils-general';
import { deployProxyImpl } from '../proxy-deployment/deploy-impl';
import { Manifest } from '../core/manifest';
import { ITUP_JSON, PROXY_ADMIN_JSON } from '../constants';
import { ZkSyncUpgradablePluginError } from '../errors';
import { getUpgradableContracts } from '../utils';

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

    const upgradeTo = await getUpgrader(hre, proxyAddress, wallet);
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

async function getUpgrader(hre: HardhatRuntimeEnvironment, proxyAddress: string, wallet: zk.Wallet): Promise<Upgrader> {
    const provider = wallet.provider as zk.Provider;

    const adminAddress = await getAdminAddress(provider, proxyAddress);
    const adminBytecode = await getCode(provider, adminAddress);

    if (isEmptySlot(adminAddress) || adminBytecode === '0x') {
        const TUPPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
            x.includes(path.sep + getUpgradableContracts().TransparentUpgradeableProxy + path.sep + ITUP_JSON),
        );
        assert(TUPPath, 'Transparent upgradeable proxy artifact not found');
        const transparentUpgradeableProxyContract = await import(TUPPath);

        const transparentUpgradeableProxyFactory = new zk.ContractFactory<any[], zk.Contract>(
            transparentUpgradeableProxyContract.abi,
            transparentUpgradeableProxyContract.bytecode,
            wallet,
        );
        const proxy = transparentUpgradeableProxyFactory.attach(proxyAddress);

        return (nextImpl, call) => (call ? proxy.upgradeToAndCall(nextImpl, call) : proxy.upgradeTo(nextImpl));
    } else {
        const manifest = await Manifest.forNetwork(provider);

        const proxyAdminPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
            x.includes(path.sep + getUpgradableContracts().ProxyAdmin + path.sep + PROXY_ADMIN_JSON),
        );
        assert(proxyAdminPath, 'Proxy admin artifact not found');
        const proxyAdminContract = await import(proxyAdminPath);

        const proxyAdminFactory = new zk.ContractFactory<any[], zk.Contract>(
            proxyAdminContract.abi,
            proxyAdminContract.bytecode,
            wallet,
        );

        const admin = proxyAdminFactory.attach(adminAddress);
        const manifestAdmin = await manifest.getAdmin();

        if ((await admin.getAddress()) !== manifestAdmin?.address) {
            throw new Error('Proxy admin is not the one registered in the network manifest');
        }

        return (nextImpl, call) =>
            call ? admin.upgradeAndCall(proxyAddress, nextImpl, call) : admin.upgrade(proxyAddress, nextImpl);
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
