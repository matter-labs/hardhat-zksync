import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Wallet } from 'zksync-ethers';
import { getNetworkAccount, getWallet as getRealWallet } from '@matterlabs/hardhat-zksync-deploy/dist/plugin';
import { Providers, createProviders } from '@matterlabs/hardhat-zksync-deploy/dist/deployer-helper';

export async function getWallet(hre: HardhatRuntimeEnvironment, privateKeyOrIndex?: string | number): Promise<Wallet> {
    const { ethWeb3Provider, zkWeb3Provider }: Providers = createProviders(hre.config.networks, hre.network);

    const wallet = (await getRealWallet(hre, privateKeyOrIndex ?? getNetworkAccount(hre)))
        .connect(zkWeb3Provider)
        .connectToL1(ethWeb3Provider);
    return wallet;
}
