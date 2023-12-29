import { expect } from 'chai';
import {
    dockerImage,
    validateDockerIsInstalled,
    createDocker,
    pullImageIfNecessary,
    compileWithDocker,
    getSolcVersion,
} from '../../../src/compile/docker';
import { HardhatDocker } from '@nomiclabs/hardhat-docker';
import { CompilerInput } from 'hardhat/types';
import { ZkSolcConfig } from '../../../src/types';
import sinon from 'sinon';

describe.skip('Docker', () => {
    let docker: HardhatDocker;

    before(async () => {
        await validateDockerIsInstalled();
        docker = await HardhatDocker.create();
    });

    describe('dockerImage', () => {
        it('should throw an error if no image name is specified', () => {
            expect(() => dockerImage()).to.throw('Docker source was chosen but no image was specified');
        });

        it('should return the correct image object', () => {
            const imageName = 'matterlabs/zksolc';
            const imageTag = 'latest';
            const image = dockerImage(imageName, imageTag);

            expect(image.repository).to.equal(imageName);
            expect(image.tag).to.equal(imageTag);
        });
    });

    describe('createDocker', () => {
        it('should create a new HardhatDocker instance', async () => {
            const hardhatDocker = await createDocker();

            expect(hardhatDocker).to.be.an('object');
            expect(hardhatDocker).to.have.property('_docker');
        });
    });

    describe('pullImageIfNecessary', () => {
        describe('pullImageIfNecessaryInner', () => {
            let hasPulledImageStub: sinon.SinonStub;
            let pullImageStub: sinon.SinonStub;
            let isImageUpToDateStub: sinon.SinonStub;


            async function booleanPromise(bool: boolean): Promise<boolean> {
                return bool;
            }

            afterEach(() => {
                hasPulledImageStub.restore();
                pullImageStub.restore();
                isImageUpToDateStub.restore();
            });


            it('should pull the Docker image if it has not been pulled before', async () => {
                hasPulledImageStub = sinon.stub(HardhatDocker.prototype, 'hasPulledImage').returns(booleanPromise(false));
                pullImageStub = sinon.stub(HardhatDocker.prototype, 'pullImage').resolves();
                isImageUpToDateStub = sinon.stub(HardhatDocker.prototype, 'isImageUpToDate').returns(booleanPromise(true));

                const image = { repository: 'matterlabs/test', tag: 'latest' };

                await pullImageIfNecessary(docker, image);

                expect(await docker.hasPulledImage(image)).to.be.false;
                sinon.assert.calledOnce(pullImageStub);
            });

            it('should check for image updates if the Docker image has been pulled before', async () => {
                hasPulledImageStub = sinon.stub(HardhatDocker.prototype, 'hasPulledImage').returns(booleanPromise(true));
                isImageUpToDateStub = sinon.stub(HardhatDocker.prototype, 'isImageUpToDate').returns(booleanPromise(true));
                pullImageStub = sinon.stub(HardhatDocker.prototype, 'pullImage').resolves();

                const image = { repository: 'matterlabs/test', tag: 'latest' };

                await pullImageIfNecessary(docker, image);

                expect(await docker.hasPulledImage(image)).to.be.true;
                sinon.assert.calledOnce(isImageUpToDateStub);
                sinon.assert.notCalled(pullImageStub);
            });

            it('should check for image updates if the Docker image has been pulled before with image not up to date', async () => {
                hasPulledImageStub = sinon.stub(HardhatDocker.prototype, 'hasPulledImage').returns(booleanPromise(true));
                isImageUpToDateStub = sinon.stub(HardhatDocker.prototype, 'isImageUpToDate').returns(booleanPromise(false));
                pullImageStub = sinon.stub(HardhatDocker.prototype, 'pullImage').resolves();

                const image = { repository: 'matterlabs/test', tag: 'latest' };

                await pullImageIfNecessary(docker, image);

                expect(await docker.hasPulledImage(image)).to.be.true;
                sinon.assert.calledOnce(isImageUpToDateStub);
                sinon.assert.calledOnce(pullImageStub);
            });
        });
    });

    
    describe('compileWithDocker', () => {
        before(async () => {
            const imageName = 'matterlabs/zksolc';
            const imageTag = 'latest';
            const image = dockerImage(imageName, imageTag);

            await pullImageIfNecessary(docker, image);
        });
        
        it('should compile the contract using Docker', async () => {
            const imageName = 'matterlabs/zksolc';
            const imageTag = 'latest';
            const image = dockerImage(imageName, imageTag);

            const zksolcConfig: ZkSolcConfig = {
                version: 'latest',
                compilerSource: "docker",
                settings: {
                    optimizer: {
                        enabled: false,
                        runs: 150
                    },
                    metadata: {
                    },
                    experimental: {
                        dockerImage: imageName,
                        tag: imageTag
                    }
                }
            };

            const input: CompilerInput = {
                language: 'Solidity',
                sources: {
                    'contracts/Greeter.sol': { content: '// SPDX-License-Identifier: MIT\n\npragma solidity >=0.4.22 <0.9.0;\n\ncontract Greeter {\n\n    string greeting;\n    string bad;\n    constructor(string memory _greeting) {\n        greeting = _greeting;\n        bad = "baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad";\n    }\n\n    function greet() public view returns (string memory) {\n        return greeting;\n    }\n\n}\n' }
                },
                settings: {
                    outputSelection: {
                        '*': {
                            '*': ['abi', 'metadata'],
                        },
                    },
                    viaIR: false,
                    optimizer: {
                        enabled: true,
                    }
                },
            };          

            const output = await compileWithDocker(input, docker, image, zksolcConfig);
            output.contracts['contracts/Greeter.sol']['Greeter'].evm.bytecode.object;
            expect(output).to.be.an('object');
            expect(output).to.have.property('contracts');
            expect(output.contracts).to.be.an('object');
            expect(output.contracts).to.have.property('contracts/Greeter.sol');
            expect(output.contracts['contracts/Greeter.sol']).to.be.an('object');
            expect(output.contracts['contracts/Greeter.sol']).to.have.property('Greeter');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']).to.be.an('object');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']).to.have.property('evm');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']['evm']).to.be.an('object');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']['evm']).to.have.property('bytecode');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']['evm']['bytecode']).to.be.an('object');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']['evm']['bytecode']).to.have.property('object');
            expect(output.contracts['contracts/Greeter.sol']['Greeter']['evm']['bytecode']['object']).to.be.a('string');

            expect(output.errors).to.be.an('array');
            expect(output.version).eq('0.8.16');
            expect(output.zk_version).eq('1.1.6');
        });
    });

    describe('getSolcVersion', () => {
        it('should return the version of the solc compiler', async () => {
            const imageName = 'matterlabs/zksolc';
            const imageTag = 'latest';
            const image = dockerImage(imageName, imageTag);

            const version = await getSolcVersion(docker, image);
            expect(version).to.be.a('string');
        });
    });

    describe('Docker', () => {
        describe('validateDockerIsInstalled', () => {
            it('should throw an error if Docker Desktop is not installed', async () => {
                // Mock the isInstalled method to return false
                HardhatDocker.isInstalled = async () => false;
                try {
                    await validateDockerIsInstalled();
                    // If the function does not throw an error, fail the test
                    expect.fail('Expected an error to be thrown');
                } catch (error: any) {
                    // Assert that the error message is correct
                    expect(error.message).to.eq(
                        'Docker Desktop is not installed.\n' +
                        'Please install it by following the instructions on https://www.docker.com/get-started'
                    );
                }
            });

            it('should not throw an error if Docker Desktop is installed', async () => {
                // Mock the isInstalled method to return true
                HardhatDocker.isInstalled = async () => true;

                try {
                    await validateDockerIsInstalled();
                } catch (error) {
                    // If the function throws an error, fail the test
                    expect.fail('Expected no error to be thrown');
                }
            });
        });
    });
});
