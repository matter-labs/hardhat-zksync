import { assert } from 'chai';
import { useEnvironment } from './helpers';
import { Contract, Wallet } from 'zksync-ethers';
import { rich_wallets } from '../src/rich-wallets';

describe('Plugin tests', async function () {
    describe('successful-compilation artifact', async function () {
        useEnvironment('simple');

        describe('HRE extensions', function () {
            it('should extend hardhat runtime environment', async function () {
                assert.isDefined(this.env.zksyncEthers);
                assert.containsAllKeys(this.env.zksyncEthers, [
                    'provider',
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

        describe('Provider', function () {
            it('the provider should handle requests', async function () {
                const gasPrice = await this.env.zksyncEthers.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
            it('should return fee data', async function () {
                const feeData = await this.env.zksyncEthers.provider.getFeeData();

                assert.typeOf(feeData.gasPrice, 'bigint');
            });
            it('should get the gas price', async function () {
                const feeData = await this.env.zksyncEthers.provider.getFeeData();

                assert.isNotNull(feeData.gasPrice);
                // assert.isTrue(feeData.gasPrice > 0);
            });
        });

        describe('getImpersonatedSigner', function () {
            it.skip('should return the working impersonated signer', async function () {
                const address = `0x${'ff'.repeat(20)}`;
                const impersonatedSigner = await this.env.zksyncEthers.getImpersonatedSigner(address);

                assert.strictEqual(impersonatedSigner.address, '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
            });
        });

        describe('wallet', function () {
            it('get default wallet', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');
            });
            it('get specific wallet', async function () {
                const wallet = await this.env.zksyncEthers.getWallet(rich_wallets[6].privateKey);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');
            });
            it('should send a transaction', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                const Greeter = await this.env.zksyncEthers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const response = await wallet.sendTransaction(tx);

                const receipt = await response.wait();

                if (receipt === null) {
                    assert.fail("receipt shoudn't be null");
                }
                assert.strictEqual(receipt.status, 1);
            });
            it('should deploy with wallet', async function () {
                const artifact = await this.env.zksyncEthers.loadArtifact('Greeter');
                const contract: Contract = await this.env.zksyncEthers.deployContract(artifact, []);

                assert.isDefined(contract);
                assert.equal((await contract.getAddress()).length, 42);
            });
            it('should allow to use the call method', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                const Greeter = await this.env.zksyncEthers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await wallet.call(tx);

                assert.isString(result);
            });
            it('should populate a transaction', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                const Greeter = await this.env.zksyncEthers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const populatedTransaction = await wallet.populateTransaction(tx);

                assert.strictEqual(populatedTransaction.from, wallet.address);
                assert.strictEqual(populatedTransaction.type, 113);
                assert.strictEqual(populatedTransaction.to, '0x0000000000000000000000000000000000008006');
            });
            it('should allow to use the estimateGas method', async function () {
                const [wallet] = await this.env.zksyncEthers.getWallets();

                const Greeter = await this.env.zksyncEthers.getContractFactory('Greeter');
                const tx = await Greeter.getDeployTransaction();

                const result = await wallet.estimateGas(tx);

                assert.isTrue(result > 0n);
            });
            it.skip('should return the balance of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, secWallet] = await this.env.zksyncEthers.getWallets();

                assert.strictEqual(
                    await this.env.zksyncEthers.provider.getBalance(secWallet.address),
                    1000000000000000000000000000000n
                );
            });
            it('should return the transaction count of the account', async function () {
                // we use the second signer because the first one is used in previous tests
                const [, secWallet] = await this.env.zksyncEthers.getWallets();

                assert.strictEqual(await this.env.zksyncEthers.provider.getTransactionCount(secWallet), 0);
            });
        });

        describe('getContractFactory', function () {
            it('should return a contract factory', async function () {
                const contract = await this.env.zksyncEthers.getContractFactory('Greeter');

                assert.isNotNull(contract.interface.getFunction('greet'));

                // non-existent functions should be null
                assert.isNull(contract.interface.getFunction('doesntExist'));
            });
            it('should fail to return a contract factory for an interface', async function () {
                try {
                    await this.env.zksyncEthers.getContractFactory('IGreeter');
                } catch (err: any) {
                    assert.equal(
                        err.message,
                        'You are trying to create a contract factory for the contract IGreeter, which is abstract and can\'t be deployed.\nIf you want to call a contract using IGreeter as its interface use the "getContractAt" function instead.'
                    );
                }
            });
            it('should return a contract factory', async function () {
                const artifact = await this.env.zksyncEthers.loadArtifact('Greeter');
                const contract = await this.env.zksyncEthers.getContractFactory(artifact.abi, artifact.bytecode);

                assert.isNotNull(contract.interface.getFunction('greet'));
            });
            it('Should be able to send txs and make calls', async function () {
                const artifact = await this.env.zksyncEthers.loadArtifact('Greeter');

                const Greeter = await this.env.zksyncEthers.getContractFactory(
                    artifact.abi,
                    artifact.bytecode
                );

                const greeter = await Greeter.deploy();

                assert.strictEqual(await greeter.greet(), 'Hello, World!');
            });
        });

        describe('getContractAt', function () {
            let deployedGreeter: Contract;

            beforeEach(async function () {
                const Greeter = await this.env.zksyncEthers.getContractFactory('Greeter');
                deployedGreeter = await Greeter.deploy();
            });
            it('Should return an instance of a contract', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();
                const contract = await this.env.zksyncEthers.getContractAt('Greeter', deployedGreeter.target.toString());

                assert.exists(contract.greet);

                assert.strictEqual(await (contract.runner as Wallet).getAddress(), await wallet.getAddress());
            });
            it('Should return an instance of an interface', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();
                const contract = await this.env.zksyncEthers.getContractAt('IGreeter', deployedGreeter.target.toString());

                assert.isNotNull(contract.interface.getFunction('greet'));

                assert.strictEqual(await (contract.runner as Wallet).getAddress(), await wallet.getAddress());
            });
            it('Should be able to send txs and make calls', async function () {
                const greeter = await this.env.zksyncEthers.getContractAt('Greeter', deployedGreeter.target.toString());

                assert.strictEqual(await greeter.greet(), 'Hello, World!');
            });
        });
    });

    describe('wallets with accounts', async function () {
        describe('wallets with accounts strings', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkAccounts');
            it('get default wallet', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0x0D43eB5B8a47bA8900d84AA36656c92024e9772e');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
            it('get valid second wallet', async function () {
                const wallet = await this.env.zksyncEthers.getWallet(1);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xa61464658AfeAf65CccaaFD3a512b69A83B77618');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
            it('get invalid third wallet', async function () {
                try {
                    const wallet = await this.env.zksyncEthers.getWallet(3);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key', async function () {
                const wallet = await this.env.zksyncEthers.getWallet(rich_wallets[6].privateKey);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
        });

        describe('wallets with accounts mnemonic', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkMenmonic');
            it('get default wallet from mnemonic', async function () {
                const wallet = await this.env.zksyncEthers.getWallet();

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
            it('get invalid second wallet with mnemonic', async function () {
                try {
                    const wallet = await this.env.zksyncEthers.getWallet(1);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key and with mnemonic', async function () {
                const wallet = await this.env.zksyncEthers.getWallet(rich_wallets[6].privateKey);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
        });
        describe('wallets with empty accounts', async function () {
            useEnvironment('simple-accounts', 'zkSyncNetworkEmptyAccounts');
            it('get default wallet from empty accounts', async function () {
                try {
                    const wallet = await this.env.zksyncEthers.getWallet();
                } catch (err: any) {
                    assert.equal(err.message, 'Accounts are not configured for this network');
                }
            });
            it('get invalid second wallet with empty accounts', async function () {
                try {
                    const wallet = await this.env.zksyncEthers.getWallet(1);
                } catch (err: any) {
                    assert.equal(err.message, 'Account private key with specified index is not found');
                }
            });
            it('get wallet with private key and with empty accounts', async function () {
                const wallet = await this.env.zksyncEthers.getWallet(rich_wallets[6].privateKey);

                assert.isDefined(wallet);
                assert.equal((await wallet.getAddress()).length, 42);
                assert.equal(await wallet.getAddress(), '0xbd29A1B981925B94eEc5c4F1125AF02a2Ec4d1cA');

                const gasPrice = await wallet.provider.send('eth_gasPrice', []);

                assert.strictEqual('0xee6b280', gasPrice);
            });
        });
    });
});
