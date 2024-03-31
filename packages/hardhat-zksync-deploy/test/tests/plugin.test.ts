import * as chai from 'chai';
import sinon from 'sinon';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { deployWithOneLine } from '../../src/plugin';

chai.use(sinonChai);

describe('deployWithOneLineAndVerify', () => {
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
        await deployWithOneLine(hre, taskArgs);

        expect(hre.deployer.deploy).to.have.been.callCount(1);
        expect(hre.run).to.have.been.callCount(1);
    });

    it('should deploy the contract without compile', async () => {
        taskArgs.noCompile = true;
        await deployWithOneLine(hre, taskArgs);
        expect(hre.run).to.have.been.callCount(0);
        expect(hre.deployer.deploy).to.have.been.callCount(1);
    });
});
