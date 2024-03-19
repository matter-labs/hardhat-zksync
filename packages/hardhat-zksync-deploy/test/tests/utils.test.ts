import { HardhatNetworkHDAccountsConfig } from 'hardhat/types';
import { expect } from 'chai';
import { Wallet } from 'zksync-ethers';
import { getWalletsFromAccount, retrieveContractBytecode } from '../../src/utils';

describe('getWalletsFromAccount', () => {
    const hre = {
        network: {
            provider: {
                send: async () => {
                    return '0x104';
                },
            },
        },
    } as any;

    it('should return an array of wallets when accounts is "remote"', async () => {
        const wallets = await getWalletsFromAccount(hre as any, 'remote');

        expect(wallets).to.be.an('array');
        expect(wallets.length).to.be.greaterThan(0);
        wallets.forEach((wallet) => {
            expect(wallet).to.be.an.instanceOf(Wallet);
        });
    });

    it('should return an array of wallets when accounts is an array of private keys', async () => {
        const accountPrivateKeys = [
            '0x28a574ab2de8a00364d5dd4b07c4f2f574ef7fcc2a86a197f65abaec836d1959',
            '0x74d8b3a188f7260f67698eb44da07397a298df5427df681ef68c45b34b61f998',
        ]; // Mock the account private keys
        const wallets = await getWalletsFromAccount(hre, accountPrivateKeys);

        expect(wallets).to.be.an('array');
        expect(wallets.length).to.equal(accountPrivateKeys.length);
        wallets.forEach((wallet) => {
            expect(wallet).to.be.an.instanceOf(Wallet);
        });
    });

    it('should return an array with a single wallet when accounts is an HD account config', async () => {
        const mnemonic = 'stuff slice staff easily soup parent arm payment cotton trade scatter struggle';
        const account: HardhatNetworkHDAccountsConfig = { mnemonic } as any;

        const wallets = await getWalletsFromAccount(hre, account);

        expect(wallets).to.be.an('array');
        expect(wallets.length).to.equal(1);
    });

    it('should return an empty array for unknown account types', async () => {
        const wallets = await getWalletsFromAccount(hre, {} as any);

        expect(wallets).to.be.an('array');
        expect(wallets.length).to.equal(0);
    });
});

describe('retrieveContractBytecode', () => {
    it('should return the bytecode string when the contract address is valid', async () => {
        const address = '0x1234567890abcdef';
        const provider = {
            send: async (method: string, params: any[]) => {
                if (method === 'eth_getCode' && params[0] === address && params[1] === 'latest') {
                    return '0xabcdef1234567890';
                }
            },
        } as any;

        const bytecode = await retrieveContractBytecode(address, provider);

        expect(bytecode).to.equal('0xabcdef1234567890');
    });

    it('should return undefined when the contract address is invalid', async () => {
        const address = '0xinvalidaddress';
        const provider = {
            send: async (method: string, params: any[]) => {
                if (method === 'eth_getCode' && params[0] === address && params[1] === 'latest') {
                    return '';
                }
            },
        } as any;

        const bytecode = await retrieveContractBytecode(address, provider);

        expect(bytecode).to.equal(undefined);
    });
});
