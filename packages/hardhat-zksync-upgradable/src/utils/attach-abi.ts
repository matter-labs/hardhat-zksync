import ITransparentUpgradeableProxyV4 from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol/ITransparentUpgradeableProxy.json';
import ProxyAdminV4 from '@openzeppelin/upgrades-core/artifacts/@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';

import { Contract, ContractFactory, Wallet } from 'zksync-ethers';

import ProxyAdminV5 from '../core/pre-compiled-artifacts/@openzeppelin/contracts-v5/proxy/transparent/ProxyAdmin.sol/ProxyAdmin.json';
import ITransparentUpgradeableProxyV5 from '../core/pre-compiled-artifacts/@openzeppelin/contracts-v5/proxy/transparent/TransparentUpgradeableProxy.sol/ITransparentUpgradeableProxy.json';

export async function attachITransparentUpgradeableProxyV5(address: string, wallet: Wallet): Promise<Contract> {
    const contractFactory = new ContractFactory(
        ITransparentUpgradeableProxyV5.abi,
        ITransparentUpgradeableProxyV5.bytecode,
        wallet,
    );
    return contractFactory.attach(address);
}

export async function attachITransparentUpgradeableProxyV4(address: string, wallet: Wallet): Promise<Contract> {
    const contractFactory = new ContractFactory(
        ITransparentUpgradeableProxyV4.abi,
        ITransparentUpgradeableProxyV4.bytecode,
        wallet,
    );
    return contractFactory.attach(address);
}

export async function attachProxyAdminV5(address: string, wallet: Wallet): Promise<Contract> {
    const contractFactory = new ContractFactory(ProxyAdminV5.abi, ProxyAdminV5.bytecode, wallet);
    return contractFactory.attach(address);
}

export async function attachProxyAdminV4(address: string, wallet: Wallet): Promise<Contract> {
    const contractFactory = new ContractFactory(ProxyAdminV4.abi, ProxyAdminV4.bytecode, wallet);
    return contractFactory.attach(address);
}
