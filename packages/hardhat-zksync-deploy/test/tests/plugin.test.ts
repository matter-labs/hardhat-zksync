import { expect } from 'chai';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import sinon from 'sinon';
import { Contract } from 'zksync-ethers';
import { fail } from 'assert';
import { deployLibraries, deployContract, getWallet } from '../../src/plugin';
import * as utils from '../../src/utils';
import * as deployer from '../../src/deployer-helper';

describe('deployLibraries', () => {
    let hre: HardhatRuntimeEnvironment;
    let consoleInfoSpy: sinon.SinonSpy;
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    beforeEach(() => {
        sandbox
            .stub(deployer, 'loadArtifact')
            .onFirstCall()
            .resolves({
                contractName: 'ChildChildLib',
                sourceName: 'contracts/ChildChildLib.sol',
                abi: {},
                bytecode: '0x1234567890',
            } as any)
            .onSecondCall()
            .resolves({
                contractName: 'ChildLib',
                sourceName: 'contracts/ChildLib.sol',
                abi: {},
                bytecode: '0x1234567890',
            } as any)
            .onThirdCall()
            .resolves({
                contractName: 'MathLib',
                sourceName: 'contracts/MathLib.sol',
                abi: {},
                bytecode: '0x1234567890',
            } as any);

        sandbox
            .stub(deployer, 'deploy')
            .onFirstCall()
            .resolves(new Contract('0x11111111111', [], {} as any))
            .onSecondCall()
            .resolves(new Contract('0x222222222222', [], {} as any))
            .onThirdCall()
            .resolves(new Contract('0x333333333333', [], {} as any));

        sandbox.stub(utils, 'getLibraryInfos').returns([
            {
                contractName: 'ChildChildLib',
                contractPath: 'contracts/ChildChildLib.sol',
                missingLibraries: [],
            },
            {
                contractName: 'ChildLib',
                contractPath: 'contracts/ChildLib.sol',
                missingLibraries: ['contracts/ChildChildLib.sol:ChildChildLib'],
            },
            {
                contractName: 'MathLib',
                contractPath: 'contracts/MathLib.sol',
                missingLibraries: ['contracts/ChildLib.sol:ChildLib'],
            },
        ]);

        consoleInfoSpy = sandbox.spy(console, 'info');

        hre = {
            run: sandbox.stub(),
            network: {
                provider: {
                    send: sandbox.stub(),
                },
                name: 'zkSyncNetwork',
                zksync: true,
                url: 'https://test.zksync.dev:3000',
                ethNetwork: 'ethNetwork',
                config: {
                    url: 'https://test.zksync.dev:3000',
                    zksync: true,
                    ethNetwork: 'https://test.zksync.dev:3000',
                },
            },
            config: {
                zksolc: {
                    settings: {
                        contractsToCompile: [],
                    },
                },
                networks: {
                    zkSyncNetwork: {
                        url: 'https://test.zksync.dev:3000',
                        zksync: true,
                    },
                    ethNetwork: {
                        url: 'https://test.zksync.dev:8545',
                    },
                },
            },
        } as any;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should deploy all libraries successfully', async () => {
        await deployLibraries(
            hre,
            '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
            '/path/',
            'config',
            true,
            false,
        );

        expect(consoleInfoSpy.callCount).to.equal(8);
        expect(consoleInfoSpy.getCall(0).args[0]).to.includes(
            'Deploying contracts/ChildChildLib.sol:ChildChildLib .....',
        );
        expect(consoleInfoSpy.getCall(1).args[0]).to.includes(
            'Deployed contracts/ChildChildLib.sol:ChildChildLib at 0x11111111111',
        );
        expect(consoleInfoSpy.getCall(2).args[0]).to.includes('Deploying contracts/ChildLib.sol:ChildLib .....');
        expect(consoleInfoSpy.getCall(3).args[0]).to.includes(
            'Deployed contracts/ChildLib.sol:ChildLib at 0x222222222222',
        );
        expect(consoleInfoSpy.getCall(4).args[0]).to.includes('Deploying contracts/MathLib.sol:MathLib .....');
        expect(consoleInfoSpy.getCall(5).args[0]).to.includes(
            'Deployed contracts/MathLib.sol:MathLib at 0x333333333333',
        );
        expect(consoleInfoSpy.getCall(6).args[0]).to.includes('All libraries deployed successfully!');
    });

    it('should deploy all libraries successfully and update hardhat.config', async () => {
        sandbox.stub(utils, 'updateHardhatConfigFile').resolves();

        await deployLibraries(
            hre,
            '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
            '/path/',
            'config',
            false,
            false,
        );

        expect(consoleInfoSpy.callCount).to.equal(8);
    });

    it('should deploy all libraries successfully and compile all contracts', async () => {
        sandbox.stub(utils, 'compileContracts').resolves();

        await deployLibraries(
            hre,
            '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
            '/path/',
            'config',
            true,
            true,
        );

        expect(consoleInfoSpy.callCount).to.equal(8);
        expect(consoleInfoSpy.getCall(7).args[0]).to.includes('Compiling all contracts');
    });

    it('shouldnt update hardhat.config file', async () => {
        sandbox
            .stub(utils, 'updateHardhatConfigFile')
            .throws(new Error('Failed to update hardhat config file, please use addresses from console output'));

        try {
            await deployLibraries(
                hre,
                '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110',
                '/path/',
                'config',
                false,
                false,
            );
            fail('should have thrown an error');
        } catch (error: any) {
            expect(error.message).to.equal(
                'Failed to update hardhat config file, please use addresses from console output',
            );
        }
    });
});

describe('getWallet', () => {
    it('should return a wallet with the specified private key', async () => {
        const privateKey = '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3';
        const hre: HardhatRuntimeEnvironment = {
            network: {
                config: {
                    accounts: [],
                },
            },
        } as any;

        const wallet = await getWallet(hre, privateKey);

        expect(wallet.privateKey).to.equal(privateKey);
    });

    it('should return a wallet with the specified account number', async () => {
        const accountNumber = 1;
        const hre: HardhatRuntimeEnvironment = {
            network: {
                config: {
                    accounts: [
                        '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3',
                        '0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8',
                        '0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93',
                    ],
                },
            },
        } as any;

        const wallet = await getWallet(hre, accountNumber);

        expect(wallet.privateKey).to.equal('0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8');
    });

    it('should throw an error if the specified account number is not found', async () => {
        const accountNumber = 3;
        const hre: HardhatRuntimeEnvironment = {
            network: {
                config: {
                    accounts: [
                        '0xac1e735be8536c6534bb4f17f06f6afc73b2b5ba84ac2cfb12f7461b20c0bbe3',
                        '0x850683b40d4a740aa6e745f889a6fdc8327be76e122f5aba645a5b02d0248db8',
                        '0xf12e28c0eb1ef4ff90478f6805b68d63737b7f33abfa091601140805da450d93',
                    ],
                },
            },
        } as any;

        try {
            await getWallet(hre, accountNumber);
            fail('should have thrown an error');
        } catch (error: any) {
            expect(error.message).to.equal('Account private key with specified index is not found');
        }
    });

    it('should throw an error if no accounts are configured for the network', async () => {
        const hre: HardhatRuntimeEnvironment = {
            network: {
                config: {
                    accounts: [],
                },
            },
        } as any;

        try {
            await getWallet(hre);
            fail('should have thrown an error');
        } catch (error: any) {
            expect(error.message).to.equal('Accounts are not configured for this network');
        }
    });
});

describe('deployWithContract', () => {
    const sandbox = sinon.createSandbox();
    let hre: HardhatRuntimeEnvironment;
    const artifact = {
        sourceName: 'contracts/MyContract.sol',
        contractName: 'MyContract',
    };

    beforeEach(() => {
        hre = {
            deployer: {
                loadArtifact: sandbox.stub().resolves(artifact),
                deploy: sandbox.stub().resolves({
                    getAddress: async () => '0x1234567890123456789012345678901234567890',
                    abi: [],
                }),
                setDeploymentType: sandbox.stub().resolves(),
            },
            run: sandbox.stub(),
        } as any;
    });

    afterEach(() => {
        sandbox.restore();
    });

    const taskArgs = {
        contractName: 'MyContract',
        constructorArgsParams: [],
        constructorArgs: undefined,
        noCompile: false,
    };

    it('should deploy the contract with compile', async () => {
        await deployContract(hre, taskArgs);

        expect(hre.deployer.deploy).to.have.been.callCount(1);
        expect(hre.deployer.setDeploymentType).to.have.been.callCount(1);
        expect(hre.run).to.have.been.callCount(1);
    });

    it('should deploy the contract without compile', async () => {
        taskArgs.noCompile = true;
        await deployContract(hre, taskArgs);
        expect(hre.run).to.have.been.callCount(0);
        expect(hre.deployer.deploy).to.have.been.callCount(1);
        expect(hre.deployer.setDeploymentType).to.have.been.callCount(1);
    });
});
