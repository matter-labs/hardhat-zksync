import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import path from 'path';

import { Contract, ContractFactory, Wallet } from 'zksync-ethers';
import assert from 'assert';
import { DeploymentType } from 'zksync-ethers/src/types';
import {
    BEACON_PROXY_JSON,
    ERC1967_PROXY_JSON,
    PROXY_ADMIN_JSON,
    TUP_JSON,
    UPGRADABLE_BEACON_JSON,
} from '../constants';
import { getUpgradableContracts } from '../utils';

export async function getProxyArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const proxyPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().ERC1967Proxy + path.sep + ERC1967_PROXY_JSON),
    );
    assert(proxyPath, 'Proxy artifact not found');
    return await import(proxyPath);
}

export async function getProxyFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<any[], Contract>> {
    const proxyContract = await getProxyArtifact(hre);
    return new ContractFactory<any[], Contract>(proxyContract.abi, proxyContract.bytecode, wallet, deploymentType);
}

export async function getTransparentUpgradeableProxyArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const transparentUpgradeableProxyPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().TransparentUpgradeableProxy + path.sep + TUP_JSON),
    );
    assert(transparentUpgradeableProxyPath, 'Transparent upgradeable proxy artifact not found');
    return await import(transparentUpgradeableProxyPath);
}

export async function getTransparentUpgradeableProxyFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<any[], Contract>> {
    const transparentUpgradeableProxy = await getTransparentUpgradeableProxyArtifact(hre);
    return new ContractFactory<any[], Contract>(
        transparentUpgradeableProxy.abi,
        transparentUpgradeableProxy.bytecode,
        wallet,
        deploymentType,
    );
}

export async function getBeaconProxyArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const beaconProxyPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().BeaconProxy + path.sep + BEACON_PROXY_JSON),
    );
    assert(beaconProxyPath, 'Beacon proxy artifact not found');
    return await import(beaconProxyPath);
}

export async function getBeaconProxyFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<any[], Contract>> {
    const beaconProxyArtifact = await getBeaconProxyArtifact(hre);
    return new ContractFactory<any[], Contract>(
        beaconProxyArtifact.abi,
        beaconProxyArtifact.bytecode,
        wallet,
        deploymentType,
    );
}

export async function getUpgradableBeaconArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const upgradeableBeaconPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().UpgradeableBeacon + path.sep + UPGRADABLE_BEACON_JSON),
    );
    assert(upgradeableBeaconPath, 'Upgradeable beacon artifact not found');
    return await import(upgradeableBeaconPath);
}

export async function getUpgradeableBeaconFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<any[], Contract>> {
    const upgradeableBeaconContract = await getUpgradableBeaconArtifact(hre);
    return new ContractFactory<any[], Contract>(
        upgradeableBeaconContract.abi,
        upgradeableBeaconContract.bytecode,
        wallet,
        deploymentType,
    );
}

export async function getProxyAdminArtifact(hre: HardhatRuntimeEnvironment): Promise<ZkSyncArtifact> {
    const proxyAdminPath = (await hre.artifacts.getArtifactPaths()).find((x) =>
        x.includes(path.sep + getUpgradableContracts().ProxyAdmin + path.sep + PROXY_ADMIN_JSON),
    );
    assert(proxyAdminPath, 'Proxy admin artifact not found');
    return await import(proxyAdminPath);
}

export async function getProxyAdminFactory(
    hre: HardhatRuntimeEnvironment,
    wallet: Wallet,
    deploymentType?: DeploymentType,
): Promise<ContractFactory<any[], Contract>> {
    const proxyAdminContract = await getProxyAdminArtifact(hre);
    return new ContractFactory<any[], Contract>(
        proxyAdminContract.abi,
        proxyAdminContract.bytecode,
        wallet,
        deploymentType,
    );
}
