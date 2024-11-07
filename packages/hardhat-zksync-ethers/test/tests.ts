import { assert } from 'chai';
import { Contract, Wallet } from 'zksync-ethers';
import { richWallets } from '../src/rich-wallets';
import { HardhatZksyncSigner } from '../src';
import { LOCAL_CHAIN_IDS_ENUM } from '../src/constants';
import { useEnvironment } from './helpers';
import '../src/type-extensions';

describe('Plugin tests', async function () {
    describe('successful-compilation artifact', async function () {
        useEnvironment('simple');

        describe('HRE extensions', function () {
            it('should extend hardhat runtime environment', async function () {
                assert.isDefined(this.env.ethers);
                assert.containsAllKeys(this.env.ethers, [
                    'provider',
                    'providerL1',
                    'providerL2',
                    'provider',
                    'getSigners',
                    'getSigner',
                    'getWallet',
                    'getWallets',
                    'getImpersonatedSigner',
                    'getContractFactory',
                    'getContractAt',
                    'extractFactoryDeps',
                    'loadArtifact',
                    'deployContract',
                ]);

                assert.isDefined(this.env.zksyncEthers);
                assert.containsAllKeys(this.env.zksyncEthers, [
                    'provider',
                    'providerL1',
                    'providerL2',
                    'provider',
                    'getSigners',
                    'getSigner',
                    'getWallet',
                    'getWallets',
                    'getImpersonatedSigner',
                    'getContractFactory',
                    'getContractAt',
                    'extractFactoryDeps',
                    'loadArtifact',
                    'deployContract',
                ]);
            });
        });

        describe('Provider L2', function () {
            it('the provider should handle requests', async function () {
                const gasPrice = await this.env.ethers.providerL2.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
            it('should get the gas price', async function () {
                const feeData = await this.env.ethers.providerL2.getFeeData();

                assert.isNotNull(feeData.gasPrice);
            });
        });

        describe('Provider', function () {
            it('the provider should handle requests', async function () {
                const gasPrice = await this.env.ethers.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
            it('should get the gas price', async function () {
                const feeData = await this.env.ethers.provider.getFeeData();

                assert.isNotNull(feeData.gasPrice);
            });
        });

        describe.skip('Provider L1', function () {
            it('should return fee data', async function () {
                const feeData = await this.env.ethers.providerL1.getFeeData();

                assert.typeOf(feeData.gasPrice, 'bigint');
                assert.isNotNull(feeData.gasPrice);
            });
        });

        describe('getImpersonatedSigner', function () {
            it.skip('should return the working impersonated signer', async function () {
                const address = `0x${'ff'.repeat(20)}`;
                const impersonatedSigner = await this.env.ethers.getImpersonatedSigner(address);

                assert.strictEqual(impersonatedSigner.address, '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
            });
        });

        describe('wallet', function () {
            it('get default wallet', async function () {
                const wallet = await this.env.ethers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.isDefined(wallet._providerL1);
                assert.isDefined(wallet._providerL2);
            });
            it('get specific wallet', async function () {
                const wallet = await this.env.ethers.getWallet(
                    richWallets[LOCAL_CHAIN_IDS_ENUM.LOCAL_SETUP][6].privateKey,
                );

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');
                assert.isDefined(wallet._providerL1);
                assert.isDefined(wallet._providerL2);
            });
            it('should send a transaction', async function () {
                const wallet = await this.env.ethers.getWallet();

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const response = await wallet.sendTransaction(tx);

                const receipt = await response.wait();

                if (receipt === null) {
                    assert.fail("receipt shoudn't be null");
                }
                assert.strictEqual(receipt.status, 1);
            });
            it('should deploy with wallet', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');
                const contract: Contract = await this.env.ethers.deployContract(artifact, []);

                assert.isDefined(contract);
                assert.equal((await contract.getAddress()).length, 42);
            });
            it('should allow to use the call method', async function () {
                const wallet = await this.env.ethers.getWallet();

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await wallet.call(tx);

                assert.isString(result);
            });
            it('should populate a transaction', async function () {
                const wallet = await this.env.ethers.getWallet();

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const populatedTransaction = await wallet.populateTransaction(tx);

                assert.strictEqual(populatedTransaction.from, wallet.address);
                assert.strictEqual(populatedTransaction.type, 113);
                assert.strictEqual(populatedTransaction.to, '0x0000000000000000000000000000000000008006');
            });
            it('should allow to use the estimateGas method', async function () {
                const [wallet] = await this.env.ethers.getWallets();

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await wallet.estimateGas(tx);

                assert.isTrue(result > 0n);
            });
            it.skip('should return the balance of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, secWallet] = await this.env.ethers.getWallets();

                assert.strictEqual(
                    await this.env.ethers.providerL2.getBalance(secWallet.address),
                    1000000000000000000000000000000n,
                );
            });
            it('should return the transaction count of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, secWallet] = await this.env.ethers.getWallets();

                assert.strictEqual(await this.env.ethers.providerL2.getTransactionCount(secWallet), 0);
            });
        });

        describe('signer', function () {
            it('get all signers', async function () {
                const signers = await this.env.ethers.getSigners();
                assert.equal(signers.length, 20);
            });
            it('get specific signer', async function () {
                const signer = await this.env.ethers.getSigner('0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                assert.isDefined(signer);
                assert.equal((await signer.getAddress()).length, 42);
                assert.equal(await signer.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');
                assert.isDefined(signer._providerL2);
            });
            it('should send a transaction', async function () {
                const signer = await this.env.ethers.getSigner('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const response = await signer.sendTransaction(tx);

                const receipt = await response.wait();

                if (receipt === null) {
                    assert.fail("receipt shoudn't be null");
                }
                assert.strictEqual(receipt.status, 1);
            });
            it('should deploy with default signer', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');
                const contract: Contract = await this.env.ethers.deployContract(artifact, []);

                assert.isDefined(contract);
                assert.equal((await contract.getAddress()).length, 42);
            });
            it('should deploy with provided signer', async function () {
                const signer = await this.env.ethers.getSigner('0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');
                const contract: Contract = await this.env.ethers.deployContract('Greeter', [], signer);

                assert.isDefined(contract);
                assert.equal((await contract.getAddress()).length, 42);
                assert.equal(
                    await (contract.runner as HardhatZksyncSigner).getAddress(),
                    '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA',
                );
            });
            it('should allow to use the call method', async function () {
                const signer = await this.env.ethers.getSigner('0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await signer.call(tx);

                assert.isString(result);
            });
            it('should populate a transaction', async function () {
                const signer = await this.env.ethers.getSigner('0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const populatedTransaction = await signer.populateTransaction(tx);

                assert.strictEqual(populatedTransaction.from, signer.address);
                assert.strictEqual(populatedTransaction.type, 113);
                assert.strictEqual(populatedTransaction.to, '0x0000000000000000000000000000000000008006');
            });
            it('should allow to use the estimateGas method', async function () {
                const [, signer] = await this.env.ethers.getSigners();

                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await signer.estimateGas(tx);

                assert.isTrue(result > 0n);
            });
            it.skip('should return the balance of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, signer] = await this.env.ethers.getSigners();

                assert.strictEqual(
                    await this.env.ethers.providerL2.getBalance(signer.address),
                    1000000000000000000000000000000n,
                );
            });
            it('should return the transaction count of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, signer] = await this.env.ethers.getSigners();

                assert.strictEqual(await this.env.ethers.provider.getTransactionCount(signer), 0);
            });
        });

        describe('getContractFactory', function () {
            it('should return a contract factory', async function () {
                const contract = await this.env.ethers.getContractFactory('Greeter');

                assert.isNotNull(contract.interface.getFunction('greet'));

                // non-existent functions should be null
                assert.isNull(contract.interface.getFunction('doesntExist'));
            });
            it('should return a contract factory with provided signer', async function () {
                const signer = await this.env.ethers.getSigner('0x0D43eB5B8a47bA8900d84AA36656c92024e9772e');
                const contract = await this.env.ethers.getContractFactory('Greeter', signer);

                assert.isNotNull(contract.interface.getFunction('greet'));
                assert.strictEqual(
                    await (contract.runner as HardhatZksyncSigner).getAddress(),
                    await signer.getAddress(),
                );

                // non-existent functions should be null
                assert.isNull(contract.interface.getFunction('doesntExist'));
            });
            it('should fail to return a contract factory for an interface', async function () {
                try {
                    await this.env.ethers.getContractFactory('IGreeter');
                } catch (err: any) {
                    assert.equal(
                        err.message,
                        'You are trying to create a contract factory for the contract IGreeter, which is abstract and can\'t be deployed.\nIf you want to call a contract using IGreeter as its interface use the "getContractAt" function instead.',
                    );
                }
            });
            it('should return a contract factory', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');
                const contract = await this.env.ethers.getContractFactory(artifact.abi, artifact.bytecode);

                assert.isNotNull(contract.interface.getFunction('greet'));
            });
            it('Should be able to send txs and make calls', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');

                const Greeter = await this.env.ethers.getContractFactory(artifact.abi, artifact.bytecode);

                const greeter = await Greeter.deploy();

                assert.strictEqual(await greeter.greet(), 'Hello, World!');
            });
        });

        describe('getContractAt', function () {
            let deployedGreeter: Contract;

            beforeEach(async function () {
                const Greeter = await this.env.ethers.getContractFactory('Greeter');
                deployedGreeter = await Greeter.deploy();
            });
            it('Should return an instance of a contract', async function () {
                const signer = await this.env.ethers.getSigner('0x0D43eB5B8a47bA8900d84AA36656c92024e9772e');
                const contract = await this.env.ethers.getContractAt(
                    'Greeter',
                    deployedGreeter.target.toString(),
                    signer,
                );

                assert.exists(contract.greet);

                assert.strictEqual(
                    await (contract.runner as HardhatZksyncSigner).getAddress(),
                    await signer.getAddress(),
                );
            });
            it('Should return an instance of an interface', async function () {
                const wallet = await this.env.ethers.getWallet();
                const contract = await this.env.ethers.getContractAt(
                    'IGreeter',
                    deployedGreeter.target.toString(),
                    wallet,
                );

                assert.isNotNull(contract.interface.getFunction('greet'));

                assert.strictEqual(await (contract.runner as Wallet).getAddress(), await wallet.getAddress());
            });
            it('Should be able to send txs and make calls', async function () {
                const greeter = await this.env.ethers.getContractAt('Greeter', deployedGreeter.target.toString());

                assert.strictEqual(await greeter.greet(), 'Hello, World!');
            });
            it('Should return an instance of a contract from artifact', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');
                const contract = await this.env.ethers.getContractAtFromArtifact(
                    artifact,
                    deployedGreeter.target.toString(),
                );

                assert.exists(contract.greet);
                assert.strictEqual(await contract.greet(), 'Hello, World!');
            });
            it('Should return an instance of a contract from abi', async function () {
                const artifact = await this.env.ethers.loadArtifact('Greeter');
                const contract = await this.env.ethers.getContractAt(artifact.abi, deployedGreeter.target.toString());

                assert.exists(contract.greet);
                assert.strictEqual(await contract.greet(), 'Hello, World!');
            });
        });

        describe('zksyncEthers legacy extension', function () {
            describe('Provider L2', function () {
                it('the provider should handle requests', async function () {
                    const gasPrice = await this.env.zksyncEthers.providerL2.send('eth_gasPrice', []);

                    assert.strictEqual('0x17d7840', gasPrice);
                });
                it('should get the gas price', async function () {
                    const feeData = await this.env.zksyncEthers.providerL2.getFeeData();

                    assert.isNotNull(feeData.gasPrice);
                });
            });

            describe('Provider', function () {
                it('the provider should handle requests', async function () {
                    const gasPrice = await this.env.zksyncEthers.provider.send('eth_gasPrice', []);

                    assert.strictEqual('0x17d7840', gasPrice);
                });
                it('should get the gas price', async function () {
                    const feeData = await this.env.zksyncEthers.provider.getFeeData();

                    assert.isNotNull(feeData.gasPrice);
                });
            });

            describe.skip('Provider L1', function () {
                it('should return fee data', async function () {
                    const feeData = await this.env.zksyncEthers.providerL1.getFeeData();

                    assert.typeOf(feeData.gasPrice, 'bigint');
                    assert.isNotNull(feeData.gasPrice);
                });
            });

            describe('getContractFactory', function () {
                it('should return a contract factory', async function () {
                    const contract = await this.env.zksyncEthers.getContractFactory('Greeter');

                    assert.isNotNull(contract.interface.getFunction('greet'));

                    // non-existent functions should be null
                    assert.isNull(contract.interface.getFunction('doesntExist'));
                });
            });
        });
    });

    describe('wallets with accounts', async function () {
        describe('wallets with accounts strings', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkAccounts');
            it('get default wallet', async function () {
                const wallet = await this.env.ethers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
            it('get valid second wallet', async function () {
                const wallet = await this.env.ethers.getWallet(1);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xa61464658AfeAf65CccaaFD3a512b69A83B77618');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
            it('get invalid third wallet', async function () {
                try {
                    const _ = await this.env.ethers.getWallet(3);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key', async function () {
                const wallet = await this.env.ethers.getWallet(
                    richWallets[LOCAL_CHAIN_IDS_ENUM.LOCAL_SETUP][6].privateKey,
                );

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
        });

        describe('signers with accounts', async function () {
            describe('signers with accounts strings', async function () {
                useEnvironment('simple-accounts', 'zkSyncNetworkAccounts');
                it('get default signer', async function () {
                    const signer = (await this.env.ethers.getSigners())[0];

                    assert.isDefined(signer);
                    assert.equal((await signer.getAddress()).length, 42);

                    const gasPrice = await signer.provider.send('eth_gasPrice', []);

                    assert.strictEqual('0x17d7840', gasPrice);
                });
                it('get valid second signer', async function () {
                    const signer = await this.env.ethers.getSigner('0xa61464658AfeAf65CccaaFD3a512b69A83B77618');

                    assert.isDefined(signer);

                    const gasPrice = await signer.provider.send('eth_gasPrice', []);

                    assert.strictEqual('0x17d7840', gasPrice);

                    const response = await signer.sendTransaction({
                        to: '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049',
                        value: 0,
                        data: '0x',
                    });

                    assert.equal(response.hash.length, 66);
                    assert.equal(response.from, '0xa61464658AfeAf65CccaaFD3a512b69A83B77618');
                });
                it('get invalid third signer', async function () {
                    const signer = (await this.env.ethers.getSigners())[15];

                    assert.isUndefined(signer);
                });

                it('get invalid signer that doesnt exist in the accounts', async function () {
                    const signer = await this.env.ethers.getSigner('0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');

                    assert.isDefined(signer);

                    try {
                        await signer.sendTransaction({
                            to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
                            value: 0,
                            data: '0x',
                        });
                    } catch (err: any) {
                        assert.equal(
                            err.message,
                            'Account 0x36615Cf349d7F6344891B1e7CA7C72883F5dc049 is not managed by the node you are connected to.',
                        );
                    }
                });
            });
        });

        describe('wallets with accounts mnemonic', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkMenmonic');
            it('get default wallet from mnemonic', async function () {
                const wallet = await this.env.ethers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
            it('get invalid second wallet with mnemonic', async function () {
                try {
                    const _ = await this.env.ethers.getWallet(1);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key and with mnemonic', async function () {
                const wallet = await this.env.ethers.getWallet(
                    richWallets[LOCAL_CHAIN_IDS_ENUM.LOCAL_SETUP][6].privateKey,
                );

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
        });
        describe('wallets with empty accounts', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkEmptyAccounts');
            it('get default wallet from empty accounts', async function () {
                try {
                    const _ = await this.env.ethers.getWallet();
                } catch (err: any) {
                    assert.equal(err.message, 'Accounts are not configured for this network');
                }
            });
            it('get invalid second wallet with empty accounts', async function () {
                try {
                    const _ = await this.env.ethers.getWallet(1);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key and with empty accounts', async function () {
                const wallet = await this.env.ethers.getWallet(
                    richWallets[LOCAL_CHAIN_IDS_ENUM.LOCAL_SETUP][6].privateKey,
                );

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0x17d7840', gasPrice);
            });
        });
    });
});
