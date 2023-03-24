import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { ContractFactory, Contract } from 'ethers';

import { Manifest, ProxyDeployment, BeaconProxyUnsupportedError, logWarning } from '@openzeppelin/upgrades-core';

import { DeployProxyOptions, DeployTransaction } from '@openzeppelin/hardhat-upgrades/src/utils';
import { deployProxyImpl } from './deploy-impl';

// TODO: Check this
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/src/types';

import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { deploy } from './deploy';
import { getInitializerData } from './initialize-data';
import * as zk from 'zksync-web3';
// import { Provider } from 'zksync-web3';
// import { deploy } from '@openzeppelin/hardhat-upgrades/src/utils/deploy';

export interface DeployFunction {
    (ImplFactory: ContractFactory, args?: unknown[], opts?: DeployProxyOptions): Promise<Contract>;
    (ImplFactory: ContractFactory, opts?: DeployProxyOptions): Promise<Contract>;
}

//TODO: Check return type
export function makeDeployProxy(hre: HardhatRuntimeEnvironment): any {
    return async function deployProxy(
        deployer: Deployer,
        artifact: ZkSyncArtifact,
        args: unknown[] | DeployProxyOptions = [],
        opts: DeployProxyOptions = {}
    ) {
        if (!Array.isArray(args)) {
            opts = args;
            args = [];
        }
        const { provider } = hre.network;
        // const provider = new Provider('https://zksync2-testnet.zksync.dev');

        // FIXME: Change this in production version

        const manifest = await Manifest.forNetwork(provider);

        const factory = new zk.ContractFactory(
            artifact.abi,
            artifact.bytecode,
            deployer.zkWallet,
            deployer.deploymentType
        );

        const { impl, kind } = await deployProxyImpl(hre, artifact, factory, deployer, opts);
        console.log('Implementation contract was deployed to ' + impl);

        const contractInterface = factory.interface;
        const data = getInitializerData(contractInterface, args, opts.initializer);

        if (kind === 'uups') {
            if (await manifest.getAdmin()) {
                logWarning(`A proxy admin was previously deployed on this network`, [
                    `This is not natively used with the current kind of proxy ('uups').`,
                    `Changes to the admin will have no effect on this new proxy.`,
                ]);
            }
        }

        let proxyDeployment: Required<ProxyDeployment & DeployTransaction>;
        switch (kind) {
            case 'beacon': {
                throw new BeaconProxyUnsupportedError();
            }

            // case 'uups': {
            //     const ProxyFactory = await getProxyFactory(hre, ImplFactory.signer);
            //     proxyDeployment = Object.assign({ kind }, await deploy(ProxyFactory, impl, data));
            //     break;
            // }

            case 'transparent': {
                const adminAddress = await hre.zkUpgrades.deployProxyAdmin(deployer, {});
                console.log('Admin was deployed to ' + adminAddress);

                // try {
                //     await hre.run('verify:verify', {
                //         address: adminAddress,
                //         constructorArguments: [],
                //     });
                // } catch (e) {
                //     console.log('Failed to verify contract', e);
                // }

                const TUPArtifact = await deployer.loadArtifact('TransparentUpgradeableProxy');
                proxyDeployment = Object.assign(
                    { kind },
                    await deploy(deployer, TUPArtifact, [impl, adminAddress, data])
                );
                console.log(`Transparent proxy was deployed to ${proxyDeployment.address}`);

                // try {
                //     await hre.run('verify:verify', {
                //         address: proxyDeployment.address,
                //         constructorArguments: [impl, adminAddress, data],
                //     });
                // } catch (e) {
                //     console.log('Failed to verify contract', e);
                // }

                break;
            }

            default: {
                throw new Error(`Unknown proxy kind: ${kind}`);
            }
        }

        await manifest.addProxy(proxyDeployment);
        const inst = factory.attach(proxyDeployment.address);
        // @ts-ignore Won't be readonly because inst was created through attach.
        inst.deployTransaction = proxyDeployment.deployTransaction;
        return inst;
    };
}
