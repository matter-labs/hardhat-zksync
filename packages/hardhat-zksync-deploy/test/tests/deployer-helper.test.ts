import * as chai from 'chai';
import { expect } from 'chai';
import { Contract, ethers } from 'ethers';
export * as zk from 'zksync-ethers';
import '../../src/type-extensions';
import { ContractFactory, Provider, Wallet } from 'zksync-ethers';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DeploymentType } from 'zksync-ethers/build/src/types';
import * as saver from '../../src/deployment-saver';
import { ZkSyncArtifact } from '../../src/types';
import {
    _extractFactoryDeps,
    createProviders,
    deploy,
    estimateDeployFee,
    loadArtifact,
} from '../../src/deployer-helper';

chai.use(sinonChai);
describe('deployer-helper', () => {
    const sandbox = sinon.createSandbox();

    describe('createProviders', () => {
        const networks = {
            localhost: {
                url: 'http://localhost:8545',
            },
            rinkeby: {
                url: 'https://rinkeby.infura.io/v3/your-infura-project-id',
            },
        };

        const network = {
            name: 'rinkeby',
            zksync: true,
            config: {
                url: 'https://rinkeby.zksync.dev',
                ethNetwork: 'rinkeby',
            },
        };

        it('should create providers for hardhat network', () => {
            const providers = createProviders(networks as any, { ...network, name: 'hardhat' } as any);

            expect(providers.ethWeb3Provider).to.be.instanceOf(ethers.JsonRpcProvider);
            expect(providers.zkWeb3Provider).to.be.instanceOf(Provider);
        });

        it('should create providers for supported L1 testnets', () => {
            const providers = createProviders(networks as any, network as any);

            expect(providers.ethWeb3Provider).to.be.instanceOf(ethers.JsonRpcProvider);
            expect(providers.zkWeb3Provider).to.be.instanceOf(Provider);
        });

        it('should create providers for localhost network', () => {
            const providers = createProviders(
                networks as any,
                { ...network, config: { url: 'https://localhost:3000', ethNetwork: 'localhost' } } as any,
            );

            expect(providers.ethWeb3Provider).to.be.instanceOf(ethers.JsonRpcProvider);
            expect(providers.zkWeb3Provider).to.be.instanceOf(Provider);
        });

        it('should create providers for custom ethNetwork URL', () => {
            const providers = createProviders(
                networks as any,
                {
                    ...network,
                    config: { url: 'https://rinkeby.zksync.dev', ethNetwork: 'https://custom-eth-network.com' },
                } as any,
            );

            expect(providers.ethWeb3Provider).to.be.instanceOf(ethers.JsonRpcProvider);
            expect(providers.zkWeb3Provider).to.be.instanceOf(Provider);
        });

        it('should throw an error for unsupported network', () => {
            const unsupportedNetwork = {
                ...network,
                config: { url: 'https://unsupported.zksync.dev', ethNetwork: 'unsupported' },
            };

            expect(() => createProviders(networks as any, unsupportedNetwork as any)).to.throw(
                `unsupported default network (operation="getDefaultProvider", code=UNSUPPORTED_OPERATION, version=6.8.0)`,
            );
        });

        it('should throw an error for missing zkSync flag', () => {
            const networkWithoutZkSyncFlag = { ...network, zksync: false };

            expect(() => createProviders(networks as any, networkWithoutZkSyncFlag as any)).to.throw(
                "Only deploying to zkSync network is supported.\nNetwork 'rinkeby' in 'hardhat.config' needs to have 'zksync' flag set to 'true'.",
            );
        });

        it('should throw an error for missing URL in network config', () => {
            const networkWithoutUrl = { ...network, config: {} };

            expect(() => createProviders(networks as any, networkWithoutUrl as any)).to.throw(
                "Only deploying to zkSync network is supported.\nNetwork 'rinkeby' in 'hardhat.config' needs to have 'url' specified.",
            );
        });
    });

    describe('loadArtifact', () => {
        const hre = {
            artifacts: {
                readArtifact: sandbox.stub(),
            },
        };

        afterEach(() => {
            sandbox.restore();
        });

        const contractNameOrFullyQualifiedName = 'MyContract';

        it('should load the artifact', async () => {
            const artifact: ZkSyncArtifact = {
                _format: 'hh-zksolc-artifact-1',
                abi: [],
                bytecode: '0x',
                deployedBytecode: '0x',
                contractName: 'MyContract',
                sourceName: 'MyContract.sol',
                deployedLinkReferences: {},
                linkReferences: {},
                sourceMapping: '',
                factoryDeps: {},
            };

            hre.artifacts.readArtifact = sandbox.stub().resolves(artifact);

            const result = await loadArtifact(hre as any, contractNameOrFullyQualifiedName);

            expect(hre.artifacts.readArtifact).to.have.been.calledOnceWith(contractNameOrFullyQualifiedName);
            expect(result).to.deep.equal(artifact);
        });

        it('should throw an error for artifacts compiled by solc or vyper', async () => {
            const artifact: ZkSyncArtifact = {
                _format: 'solc',
                // Add other properties of the artifact as needed
            } as any;

            hre.artifacts.readArtifact = sandbox.stub().resolves(artifact);

            try {
                await loadArtifact(hre as any, contractNameOrFullyQualifiedName);
            } catch (error: any) {
                expect(error.message).to.equal(
                    `Artifact ${contractNameOrFullyQualifiedName} was not compiled by zksolc or zkvyper`,
                );
            }
        });
    });

    describe('deploy', () => {
        const hre = {
            artifacts: {
                readArtifact: sandbox.stub(),
            },
            network: {
                forceDeploy: false,
            },
        } as any;

        const contractNameOrArtifact: ZkSyncArtifact = {
            _format: 'hh-zksolc-artifact-1',
            abi: [],
            bytecode: '0x',
            deployedBytecode: '0x',
            contractName: 'MyContract',
            sourceName: 'MyContract.sol',
            deployedLinkReferences: {},
            linkReferences: {},
            sourceMapping: '',
            factoryDeps: {},
        };

        const constructorArguments: any[] = [];
        const zkWallet: Wallet = {} as Wallet;
        const deploymentType: DeploymentType = 'create';
        const overrides: ethers.Overrides = {};
        const additionalFactoryDeps: ethers.BytesLike[] = [];

        afterEach(() => {
            sandbox.restore();
        });

        it('should return existing contract if deployment entry exists', async () => {
            const deploymentEntry = {
                address: '0x123456789',
                constructorArgs: [],
                salt: ethers.ZeroHash,
                deploymentType,
                factoryDeps: [],
                txHash: '0xabcdef',
            };

            sandbox.stub(hre, 'network').value({
                forceDeploy: false,
            });

            hre.artifacts.readArtifact = sandbox.stub().resolves(contractNameOrArtifact);
            sandbox.stub(saver, 'loadCache').resolves(deploymentEntry);

            const result = await deploy(
                hre,
                contractNameOrArtifact,
                constructorArguments,
                zkWallet,
                deploymentType,
                overrides,
                additionalFactoryDeps,
            );

            expect(result).to.be.instanceOf(Contract);
            expect(await result.getAddress()).to.equal(deploymentEntry.address);
        });

        it('should deploy new contract if deployment entry does not exist', async () => {
            sandbox.stub(hre, 'network').value({
                forceDeploy: false,
            });

            hre.artifacts.readArtifact = sandbox.stub().resolves(contractNameOrArtifact);
            sandbox.stub(saver, 'loadCache').resolves(undefined);
            sandbox.stub(saver, 'saveCache').resolves();
            sandbox.stub(ContractFactory.prototype, 'deploy').resolves({
                getAddress: sandbox.stub().resolves('0x123456789'),
                deploymentTransaction: sandbox.stub().returns({ hash: '0xabcdef' }),
                waitForDeployment: sandbox.stub().resolves(),
            } as any);

            const result = await deploy(
                hre,
                contractNameOrArtifact,
                constructorArguments,
                zkWallet,
                deploymentType,
                overrides,
                additionalFactoryDeps,
            );

            expect(await result.getAddress()).to.equal('0x123456789');
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(ContractFactory.prototype.deploy).to.have.been.calledOnce;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(saver.saveCache).to.have.been.calledOnce;
        });
    });

    describe('estimateDeployFee', () => {
        const hre = {} as any;
        const artifact: ZkSyncArtifact = {
            _format: 'hh-zksolc-artifact-1',
            abi: [],
            bytecode: ethers.ZeroHash,
            deployedBytecode: ethers.ZeroHash,
            contractName: 'MyContract',
            sourceName: 'MyContract.sol',
            deployedLinkReferences: {},
            linkReferences: {},
            sourceMapping: '',
            factoryDeps: {},
        };
        const constructorArguments: any[] = [];
        const zkWallet: Wallet = {
            provider: {
                getGasPrice: sandbox.stub(),
                estimateGas: sandbox.stub(),
            },
        } as any;

        afterEach(() => {
            sandbox.restore();
        });

        it('should estimate the deployment fee', async () => {
            const gasPrice = 1000000000n;
            const estimateGas = 10n;
            zkWallet.provider.getGasPrice = sandbox.stub().resolves(gasPrice);
            zkWallet.provider.estimateGas = sandbox.stub().resolves(estimateGas);
            const result = await estimateDeployFee(hre, artifact, constructorArguments, zkWallet);

            expect(result).to.equal(estimateGas * gasPrice);
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(zkWallet.provider.estimateGas).to.have.been.calledOnce;
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            expect(zkWallet.provider.getGasPrice).to.have.been.calledOnce;
        });
    });
});
