import assert from 'assert';
import {
    TASK_CHECK_VERIFICATION_STATUS,
} from '@matterlabs/hardhat-zksync-verify-vyper/dist/src/constants';

import chalk from 'chalk';
import { CONTRACT_ALREADY_VERIFIED_ERROR, MOCK_ADDRESS, WRONG_NUMBER_OF_CONSTRUCTOR_ARGUMENTS_ERROR, useEnvironment } from './helpers';

describe('verify plugin', async function () {
    const testnetVerifyURL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

    describe('Testnet verifyURL extraction from config', async function () {
        useEnvironment();

        it('Reads verifyURL form network config for existing network ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('Unknown verifyURL in config', async function () {
        useEnvironment('customNetwork');

        it('Checks impoting deafault verifyURL when it does not exist in the config ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('Test verification of the simple Greeter contract', async function () {
        useEnvironment();

        beforeEach('Deploy Greeter contract', async function () {
            const contractName = 'Greeter';
            const constructorArgs:any[] = [];

            const factoryContract = await this.env.zksyncEthers.getContractFactory(contractName);
            const contract = await factoryContract.deploy(constructorArgs);

            this.deployedAddress = await contract.getAddress();
            console.info(chalk.green(`${contractName} was deployed to ${this.deployedAddress}`));

            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
        it('Test verification happy path of the simple Greeter contract', async function () {
            const constructorArgs:any[] = [];

            const verificationId = await this.env.run('verify:verify:vyper', {
                address: this.deployedAddress,
                constructorArguments: constructorArgs,
            });

            const success = await this.env.run(TASK_CHECK_VERIFICATION_STATUS, { verificationId: verificationId });

            assert.equal(success, true);
        });

        it('Test verification of the already verified contract', async function () {
            const constructorArgs:any[] = [];

            await this.env.run('verify:verify:vyper', {
                address: this.deployedAddress,
                constructorArguments: constructorArgs,
            });

            // wait for 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));

            try {
                // Run the verification again on the previously verified contract
                await this.env.run('verify:verify:vyper', {
                    address: this.deployedAddress,
                    constructorArguments: constructorArgs,
                });
            } catch (error: any) {
                assert(error.message.includes(CONTRACT_ALREADY_VERIFIED_ERROR));
            }
        });

        it('Test verification with the wrong nubmer of contructor arguments', async function () {
            try {
                // Run the verification again on the previously verified contract
                await this.env.run('verify:verify:vyper', {
                    address: this.deployedAddress,
                    constructorArguments: ["0x123","Wrong number"],
                });
            } catch (error: any) {
                console.info(error.message)
                assert(error.message.includes(WRONG_NUMBER_OF_CONSTRUCTOR_ARGUMENTS_ERROR));
            }
        });
    });
});