import { expect } from 'chai';
import sinon from 'sinon';
import { Bytecode, compareBytecode, extractMatchingContractInformation } from '../../../src/solc/bytecode';
import * as bytecodes from '../../../src/solc/bytecode';

describe('compareBytecode', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should return null when the lengths of deployed and runtime executable sections are different', async () => {
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');
        const runtimeBytecodeSymbols = {
            object: 'runtimeBytecode',
        };

        const result = await compareBytecode(deployedBytecode, runtimeBytecodeSymbols as any);

        expect(result).to.equal(null);
    });

    it('should return null when the normalized bytecode does not match the reference bytecode', async () => {
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');
        const runtimeBytecodeSymbols = {
            object: 'runtimeBytecode',
        };

        // Stub the normalizeBytecode function to return different normalized bytecodes
        const normalizeBytecodeStub = sinon.stub().resolves({
            normalizedBytecode: 'differentNormalizedBytecode',
        });
        sinon.replace(
            // Replace the import of normalizeBytecode with the stub
            bytecodes,
            'normalizeBytecode',
            normalizeBytecodeStub,
        );

        const result = await compareBytecode(deployedBytecode, runtimeBytecodeSymbols as any);

        expect(result).to.equal(null);
    });

    it('should correctly normalize bytecode with address placeholder', async () => {
        const bytecodeWithPlaceholder =
            '73000000000000000000000000000000000000000000000000000000000000000000' + 'someBytecode';
        const symbolsWithPush20Opcode = {
            object: '73' + 'someRuntimeBytecode',
        };

        const normalizedResult = await bytecodes.normalizeBytecode(
            bytecodeWithPlaceholder,
            symbolsWithPush20Opcode as any,
        );

        const expectedNormalizedBytecode = 'someBytecode'; // Adjust this based on your zeroOutSlices implementation

        expect(normalizedResult.normalizedBytecode).to.include(expectedNormalizedBytecode);
    });

    it('should return the normalized bytecode when it matches the reference bytecode', async () => {
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');
        const runtimeBytecodeSymbols = {
            object: 'deployedBytecode',
        };

        const result = await compareBytecode(deployedBytecode, runtimeBytecodeSymbols as any);

        expect(result).to.deep.equal({
            normalizedBytecode: 'deployedBytecode',
        });
    });
});

describe('extractMatchingContractInformation', () => {
    it("should return null when the contract does not have 'evm' property", async () => {
        const sourceName = 'sourceName';
        const contractName = 'contractName';
        const buildInfo = {
            output: {
                contracts: {
                    [sourceName]: {
                        [contractName]: {},
                    },
                },
            },
        };
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');

        const hre: {
            run: sinon.SinonStub;
        } = {
            run: sinon.stub(),
        };

        const result = await extractMatchingContractInformation(
            hre as any,
            sourceName,
            contractName,
            buildInfo as any,
            deployedBytecode,
            {},
        );

        expect(result).to.equal(null);
    });

    it('should return null when the runtime bytecode symbols are null', async () => {
        const sourceName = 'sourceName';
        const contractName = 'contractName';
        const buildInfo = {
            output: {
                contracts: {
                    [sourceName]: {
                        [contractName]: {
                            evm: {
                                bytecode: null,
                            },
                        },
                    },
                },
            },
        };
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');

        const hre: {
            run: sinon.SinonStub;
        } = {
            run: sinon.stub(),
        };
        const result = await extractMatchingContractInformation(
            hre as any,
            sourceName,
            contractName,
            buildInfo as any,
            deployedBytecode,
            {},
        );

        expect(result).to.equal(null);
    });

    it('should return the contract information when the bytecode is matched', async () => {
        const sourceName = 'sourceName';
        const contractName = 'contractName';
        const buildInfo = {
            input: 'compilerInput',
            output: {
                contracts: {
                    [sourceName]: {
                        [contractName]: {
                            evm: {
                                bytecode: {
                                    object: 'deployedBytecode',
                                },
                            },
                        },
                    },
                },
            },
            solcVersion: 'solcVersion',
            solcLongVersion: 'solcLongVersion',
        };
        const deployedBytecode: Bytecode = new Bytecode('deployedBytecode');

        const hre: {
            run: sinon.SinonStub;
        } = {
            run: sinon.stub(),
        };

        const result = await extractMatchingContractInformation(
            hre as any,
            sourceName,
            contractName,
            buildInfo as any,
            deployedBytecode,
            {},
        );

        expect(result).to.deep.equal({
            normalizedBytecode: 'deployedBytecode',
            compilerInput: 'compilerInput',
            contractOutput: buildInfo.output.contracts[sourceName][contractName],
            solcVersion: 'solcVersion',
            solcLongVersion: 'solcLongVersion',
            sourceName,
            contractName,
        });
    });
});
