import { expect } from 'chai';
import { SolcConfig, SolcUserConfig } from 'hardhat/types';
import { fail } from 'assert';
import {
    CompilerSolcUserConfigNormalizer,
    OverrideCompilerSolcUserConfigNormalizer,
} from '../../src/config-normalizer';

describe('CompilerSolcUserConfigNormalizer', () => {
    describe('suituble', () => {
        it('should return true when solcUserConfig is an array and file is undefined', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const solcUserConfig: SolcUserConfig[] = [];
            const file = undefined;

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(true);
        });

        it('should return false when solcUserConfig is not an array', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const solcUserConfig: Map<string, SolcUserConfig> = new Map();
            const file = undefined;

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });

        it('should return false when file is defined', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const solcUserConfig: SolcUserConfig[] = [];
            const file = 'path/to/file.sol';

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });
    });

    describe('normalize', () => {
        it('should return the normalized version when there is a single compiler info', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers: SolcUserConfig[] = [
                {
                    version: '0.8.17',
                    eraVersion: '0.1.0',
                },
            ];
            const file = undefined;

            const result = normalizer.normalize(compiler, userConfigCompilers, file);

            expect(result).to.equal('zkVM-0.8.17-0.1.0');
        });

        it('should return the original version when there is no compiler info', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers: SolcUserConfig[] = [];
            const file = undefined;

            const result = normalizer.normalize(compiler, userConfigCompilers, file);

            expect(result).to.equal('0.8.17');
        });

        it('should throw an error when there are multiple compiler infos with conflicting era versions', () => {
            const normalizer = new CompilerSolcUserConfigNormalizer();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers: SolcUserConfig[] = [
                {
                    version: '0.8.17',
                    eraVersion: '0.1.0',
                },
                {
                    version: '0.8.17',
                },
            ];
            const file = undefined;

            try {
                normalizer.normalize(compiler, userConfigCompilers, file);
                fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(
                    'Solidity compiler versions in your Hardhat config file are in conflict for version 0.8.17. Please specify version of compiler only with zkVm support(eraVersion) or without it',
                );
            }
        });
    });
});

describe('OverrideCompilerSolcUserConfigNormalizer', () => {
    describe('suituble', () => {
        it('should return true when solcUserConfig is an instance of Map and file is defined', () => {
            const normalizer = new OverrideCompilerSolcUserConfigNormalizer();
            const solcUserConfig: Map<string, SolcUserConfig> = new Map();
            const file = 'path/to/file.sol';

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(true);
        });

        it('should return false when solcUserConfig is not an instance of Map', () => {
            const normalizer = new OverrideCompilerSolcUserConfigNormalizer();
            const solcUserConfig: SolcUserConfig[] = [];
            const file = 'path/to/file.sol';

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });

        it('should return false when file is undefined', () => {
            const normalizer = new OverrideCompilerSolcUserConfigNormalizer();
            const solcUserConfig: Map<string, SolcUserConfig> = new Map();
            const file = undefined;

            const result = normalizer.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });
    });

    describe('normalize', () => {
        it('should return the normalized version when compiler info exists for the file', () => {
            const normalizer = new OverrideCompilerSolcUserConfigNormalizer();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers: Map<string, SolcUserConfig> = new Map([
                ['path/to/file.sol', { version: '0.8.17', eraVersion: '0.1.0' }],
            ]);
            const file = 'path/to/file.sol';

            const result = normalizer.normalize(compiler, userConfigCompilers, file);

            expect(result).to.equal('zkVM-0.8.17-0.1.0');
        });

        it('should return the original version when compiler info does not exist for the file', () => {
            const normalizer = new OverrideCompilerSolcUserConfigNormalizer();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers: Map<string, SolcUserConfig> = new Map();
            const file = 'path/to/file.sol';

            const result = normalizer.normalize(compiler, userConfigCompilers, file);

            expect(result).to.equal('0.8.17');
        });
    });
});
