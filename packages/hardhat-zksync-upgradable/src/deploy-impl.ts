import {
    fetchOrDeployGetDeployment,
    getStorageLayout,
    getUnlinkedBytecode,
    getVersion,
    StorageLayout,
    UpgradesError,
    ValidationDataCurrent,
    ValidationOptions,
    Version,
} from '@openzeppelin/upgrades-core';
// import type { ContractFactory, ethers } from 'ethers';
import { FormatTypes } from 'ethers/lib/utils';
import type { EthereumProvider, HardhatRuntimeEnvironment } from 'hardhat/types';
// import { deploy } from '@openzeppelin/hardhat-upgrades/src/utils/deploy';
import { GetTxResponse, StandaloneOptions, UpgradeOptions, withDefaults } from './options';
import { validateBeaconImpl, validateProxyImpl, validateImpl } from './utils/validate-impl';
import { readValidations } from './validations';
import { ZkSyncArtifact } from '@matterlabs/hardhat-zksync-deploy/dist/types';
import { Deployer } from '@matterlabs/hardhat-zksync-deploy';
import { ContractFactory } from 'zksync-web3';
import { deploy } from './deploy';
import ethers from 'ethers';
// import { Provider } from 'zksync-web3';
import { Artifact } from 'hardhat/types';

// interface DeployedProxyImpl {
//     impl: string;
//     kind: NonNullable<ValidationOptions['kind']>;
//     txResponse?: ethers.providers.TransactionResponse;
// }

// interface DeployedBeaconImpl {
//     impl: string;
//     txResponse?: ethers.providers.TransactionResponse;
// }

export interface DeployData {
    provider: EthereumProvider;
    validations: ValidationDataCurrent;
    unlinkedBytecode: string;
    encodedArgs: string;
    version: Version;
    layout: StorageLayout;
    fullOpts: Required<UpgradeOptions>;
}

export async function getDeployData(
    hre: HardhatRuntimeEnvironment,
    // TODO: Change to bytecode instead of artifact
    contractFactory: ContractFactory,
    opts: UpgradeOptions
): Promise<DeployData> {
    const { provider } = hre.network;
    const validations = await readValidations(hre);
    const unlinkedBytecode = getUnlinkedBytecode(validations, contractFactory.bytecode);
    const encodedArgs = contractFactory.interface.encodeDeploy(opts.constructorArgs);
    const version = getVersion(unlinkedBytecode, contractFactory.bytecode, encodedArgs);
    const layout = getStorageLayout(validations, version);
    const fullOpts = withDefaults(opts);
    return { provider, validations, unlinkedBytecode, encodedArgs, version, layout, fullOpts };
}

export async function deployStandaloneImpl(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    ImplFactory: ContractFactory,
    deployer: Deployer,
    opts: StandaloneOptions
    // TODO: Change promise to "DeployedProxyImpl"
): Promise<any> {
    const deployData = await getDeployData(hre, ImplFactory, opts);
    await validateImpl(deployData, opts);
    return await deployImpl(hre, deployData, deployer, artifact, opts);
}

export async function deployProxyImpl(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    contractFactory: ContractFactory,
    deployer: Deployer,
    opts: UpgradeOptions,
    proxyAddress?: string
): Promise<any> {
    const deployData = await getDeployData(hre, contractFactory, opts);
    await validateProxyImpl(deployData, opts, proxyAddress);
    return await deployImpl(hre, deployData, deployer, artifact, opts);
}

//TODO: Ucomment this function
// export async function deployBeaconImpl(
//     hre: HardhatRuntimeEnvironment,
//     ImplFactory: ContractFactory,
//     opts: UpgradeOptions,
//     beaconAddress?: string
// ): Promise<DeployedBeaconImpl> {
//     const deployData = await getDeployData(hre, contractArtifact, opts);
//     await validateBeaconImpl(deployData, opts, beaconAddress);
//     return await deployImpl(hre, deployData, ImplFactory, opts);
// }

async function deployImpl(
    hre: HardhatRuntimeEnvironment,
    deployData: DeployData,
    deployer: Deployer,
    artifact: ZkSyncArtifact,
    opts: UpgradeOptions & GetTxResponse
): Promise<any> {
    const layout = deployData.layout;

    const deployment = await fetchOrDeployGetDeployment(
        deployData.version,
        deployData.provider,
        async () => {
            // const abi = ImplFactory.interface.format(FormatTypes.minimal) as string[];
            const abi = artifact.abi as string[];
            const attemptDeploy = async () => {
                if (opts.useDeployedImplementation) {
                    throw new UpgradesError(
                        'The implementation contract was not previously deployed.',
                        () =>
                            'The useDeployedImplementation option was set to true but the implementation contract was not previously deployed on this network.'
                    );
                } else {
                    const deployed = await deploy(deployer, artifact, deployData.fullOpts.constructorArgs);

                    // try {
                    //     await hre.run('verify:verify', {
                    //         address: deployed.address,
                    //         constructorArguments: deployData.fullOpts.constructorArgs,
                    //     });
                    // } catch (e) {
                    //     console.log('Failed to verify contract', e);
                    // }

                    return deployed;
                }
            };
            const deployment = Object.assign({ abi }, await attemptDeploy());
            return { ...deployment, layout };
        },
        opts
    );

    let txResponse;
    if (opts.getTxResponse) {
        if ('deployTransaction' in deployment) {
            txResponse = deployment.deployTransaction;
        } else if (deployment.txHash !== undefined) {
            txResponse = hre.ethers.provider.getTransaction(deployment.txHash);
        }
    }

    return { impl: deployment.address, kind: opts.kind, txResponse };
}

interface DeployedBeaconImpl {
    impl: string;
    txResponse?: ethers.providers.TransactionResponse;
}

export async function deployBeaconImpl(
    hre: HardhatRuntimeEnvironment,
    artifact: ZkSyncArtifact,
    factory: ContractFactory,
    deployer: Deployer,
    opts: UpgradeOptions,
    beaconAddress?: string
): Promise<DeployedBeaconImpl> {
    const deployData = await getDeployData(hre, factory, opts);
    await validateBeaconImpl(deployData, opts, beaconAddress);
    return await deployImpl(hre, deployData, deployer, artifact, opts);
}
