import { expect } from 'chai';
import { CompilerInput } from 'hardhat/types';
import path from 'path';
import { compile } from '../../../src/compile';
import { ZkSolcConfig } from '../../../src/types';

describe('compile', () => {
    const input: CompilerInput = {
        language: 'Solidity',
        sources: {
            'contracts/Greeter.sol': {
                content:
                    '// SPDX-License-Identifier: MIT\n\npragma solidity >=0.4.22 <0.9.0;\n\ncontract Greeter {\n\n    string greeting;\n    string bad;\n    constructor(string memory _greeting) {\n        greeting = _greeting;\n        bad = "baaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad";\n    }\n\n    function greet() public view returns (string memory) {\n        return greeting;\n    }\n\n}\n',
            },
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
            },
        },
    };

    it.skip('should compile with binary compiler', async () => {
        let zksolcPath;
        let solcPath;

        if (process.platform) {
            zksolcPath = path.resolve('./test/compiler-files/linux/zksolc');
            solcPath = path.resolve('./test/compiler-files/linux/solc');
        } else {
            zksolcPath = path.resolve('./test/compiler-files/macos/zksolc');
            solcPath = path.resolve('./test/compiler-files/macos/solc');
        }

        const zksolcConfig: ZkSolcConfig = {
            compilerSource: 'binary',
            version: '1.3.17',
            settings: {
                compilerPath: zksolcPath,
            },
        };

        const result = await compile(zksolcConfig, input, solcPath);

        expect(result).to.be.an('object');
        expect(result).to.have.property('errors');
    });

    it.skip('should compile with docker compiler', async () => {
        const zksolcConfig: ZkSolcConfig = {
            compilerSource: 'docker',
            version: '1.3.17',
            settings: {
                experimental: {
                    dockerImage: 'matterlabs/zksolc',
                    tag: 'latest',
                },
            },
        };

        const result = await compile(zksolcConfig, input);

        expect(result).to.be.an('object');
        expect(result).to.have.property('errors');
    });

    it('should throw an error for incorrect compiler source', async () => {
        const zksolcConfig: ZkSolcConfig = {
            compilerSource: undefined,
            version: '',
            settings: {},
        };

        try {
            await compile(zksolcConfig, input);
            // If the function does not throw an error, fail the test
            expect.fail('Expected ZkSyncSolcPluginError to be thrown');
        } catch (error: any) {
            // Add your assertions here
            // For example, you can check if the error message is as expected
            expect(error.message).to.equal('Incorrect compiler source: undefined');
        }
    });
});
