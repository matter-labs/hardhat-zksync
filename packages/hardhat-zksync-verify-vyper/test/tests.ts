import { assert } from 'chai';
import { TASK_VERIFY_GET_ARTIFACT } from '../src/constants';
import {
    checkContractName,
    checkVerificationStatus,
    delay,
    getCacheResolvedFileInformation,
    getDeployArgumentEncoded,
    getResolvedFiles,
} from '../src/plugin';
import { useEnvironment } from './helpers';

describe('verify plugin', async function () {
    const sourceName: string = 'contracts/Greeter.vy';
    const testnetVerifyURL = 'https://explorer.sepolia.era.zksync.dev/contract_verification';

    describe('Testnet verifyURL extraction from config', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('Reads verifyURL form network config for existing network ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('Unknown verifyURL in config', async function () {
        useEnvironment('localGreeter', 'customNetwork');

        it('Checks impoting deafault verifyURL when it does not exist in the config ', async function () {
            assert.equal(this.env.network.verifyURL, testnetVerifyURL);
        });
    });

    describe('Artifact cache information', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('Verifies contract with provided source name', async function () {
            const contractName = 'contracts/Greeter.vy:Greeter';
            const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, {
                contractFQN: contractName,
                deployedBytecode: '0x',
            });

            const { resolvedFile, contractCache } = await getCacheResolvedFileInformation(
                sourceName,
                artifact.sourceName,
                this.env,
            );

            assert.equal(resolvedFile.sourceName, sourceName);
            assert.equal(contractCache.sourceName, sourceName);
            assert.equal(contractCache.vyperConfig.version, '0.3.3');
        });
    });

    describe('Check verification status', async function () {
        useEnvironment('localGreeter', 'testnet');
        const validId = 1;
        // id is invalid because its too big and there are for sure not this many verified contracts.
        const invalidId = 1000000000;

        it('should pass the verification', async function () {
            let isErr = 0;
            try {
                const x = await checkVerificationStatus({ verificationId: validId }, this.env);
                await delay(100);
                assert(x === true, `Contract with verificationId: ${validId} is not verified.`);
            } catch (e: any) {
                isErr = 1;
                console.info(e);
            }
            assert(!isErr, 'Unexpectedly not passed the valid verification');
        });

        it('should not pass the verification (AXIOS - Bad Request)', async function () {
            let isErr = 0;
            try {
                await checkVerificationStatus({ verificationId: invalidId }, this.env);
            } catch (e: any) {
                isErr = 1;
            }
            assert(isErr, `Contract with verificationId: ${invalidId} is verified.`);
        });
    });

    describe('Checks Artifacts', async function () {
        useEnvironment('localGreeter', 'testnet');

        it('fails to checks contract name', async function () {
            try {
                await checkContractName(this.env.artifacts, 'TestContract.vy');
            } catch (e: any) {
                assert(
                    e.message.includes(
                        'A valid fully qualified name was expected. Fully qualified names look like this: ',
                    ),
                    'Error message does not include the expected text',
                );
            }
        });

        it('fails to find contract name', async function () {
            try {
                await checkContractName(this.env.artifacts, 'contracts/Greeter.vy:GreeterFailed');
            } catch (e: any) {
                assert(
                    e.message.includes('"contracts/Greeter.vy:GreeterFailed" not found.'),
                    'Error message does not include the expected text',
                );
            }
        });

        it('Checks contract name', async function () {
            let isErr = 0;
            try {
                await checkContractName(this.env.artifacts, 'contracts/Greeter.vy:Greeter');
            } catch (e: any) {
                isErr = 1;
            }
            assert(!isErr, 'contracts/Greeter.vy:Greeter should have been valid fully qualified name');
        });

        it('fails to find fully qualified contract name', async function () {
            try {
                await checkContractName(this.env.artifacts, undefined as any);
            } catch (e: any) {
                assert(
                    e.message.includes('You did not provide any contract name.'),
                    'Error message does not include the expected text',
                );
            }
        });
    });

    describe('Resolve file', async function () {
        useEnvironment('localGreeter', 'testnet');
        it('Resolve single vyper contract', async function () {
            let isErr = 0;
            try {
                const resolvedFiles = await getResolvedFiles(this.env);
                assert(
                    resolvedFiles[0].sourceName === 'contracts/Greeter.vy',
                    'Greeter.vy not found at position 0 of resolved files.',
                );
            } catch (e: any) {
                isErr = 1;
                console.info(e);
            }
            assert(!isErr, 'Unexpectedly not passed the resolving test');
        });
    });

    describe('Constructor argument encoding', async function () {
        useEnvironment('localGreeter', 'testnet');
        const contractFQN = 'contracts/Greeter.vy:Greeter';
        const deployedBytecode = '0x';

        it('Fails to encode', async function () {
            try {
                const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
                await getDeployArgumentEncoded('', artifact);
            } catch (e: any) {
                assert(
                    e.message.includes('Wrong constructor arguments format:'),
                    'Error message does not include the expected text',
                );
            }
        });

        it('Fails to encode because missmatch in length', async function () {
            try {
                const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
                await getDeployArgumentEncoded([], artifact);
            } catch (e: any) {
                assert(
                    e.message.includes(
                        'The number of constructor arguments you provided (0) does not match the number of constructor arguments the contract has been deployed with (1).',
                    ),
                    'Error message does not include the expected text',
                );
            }
        });

        it('Encode correctly, variation 1', async function () {
            let isErr = 0;
            try {
                const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
                const result = await getDeployArgumentEncoded([''], artifact);
                assert(
                    result ===
                        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
                    'Invalid encoding!',
                );
            } catch (e: any) {
                isErr = 1;
                console.info(e);
            }
            assert(!isErr, 'Should not fail to encode');
        });

        it('Encode correctly, variation 2', async function () {
            let isErr = 0;
            try {
                const artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
                const result = await getDeployArgumentEncoded(['Hello'], artifact);
                assert(
                    result ===
                        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000548656c6c6f000000000000000000000000000000000000000000000000000000',
                    '"Invalid encoding!"',
                );
            } catch (e: any) {
                isErr = 1;
                console.info(e);
            }
            assert(!isErr, 'Should not fail to encode');
        });
    });

    describe('Verification fail', async function () {
        useEnvironment('localGreeter', 'testnet');
        const contractFQN = 'contracts/Greeter.vy:Greeter';
        const deployedBytecode = '0x';
        const placeholderAddress = '0x481c92dA8df49B5B96f59a65aB91eb67235aD648';
        it('Should not match any bytecode', async function () {
            try {
                const _artifact = await this.env.run(TASK_VERIFY_GET_ARTIFACT, { contractFQN, deployedBytecode });
                const _verificationId = await this.env.run('verify:verify:vyper', {
                    address: placeholderAddress,
                    constructorArguments: [],
                });
            } catch (e: any) {
                assert(
                    e.message.includes(
                        "The address provided as argument contains a contract, but its bytecode doesn't match any of your local contracts.",
                    ),
                    'Error message does not include the expected text',
                );
            }
        });
    });
});
