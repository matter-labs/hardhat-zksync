import { expect } from 'chai';
import { SolcConfig, SolcUserConfig } from 'hardhat/types';
import { CompilerSolcUserConfigUpdater } from '../../src/config-update';
import { ZkSolcConfig } from '../../src/types';

describe('CompilerSolcUserConfigUpdater', () => {
    describe('suituble', () => {
        it('should return true when solcUserConfig is an array and file is undefined', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const solcUserConfig: SolcUserConfig[] = [];
            const file = undefined;

            const result = updater.suituble(solcUserConfig, file);

            expect(result).to.be.equal(true);
        });

        it('should return false when solcUserConfig is not an array', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const solcUserConfig = new Map();
            const file = undefined;

            const result = updater.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });

        it('should return false when file is defined', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const solcUserConfig = [
                {
                    version: '0.8.17',
                    eraVersion: 'latest',
                    settings: {
                        optimizer: {
                            enabled: true,
                            runs: 200,
                        },
                        outputSelection: {},
                        metadata: {},
                    },
                },
            ];
            const file = 'path/to/file';

            const result = updater.suituble(solcUserConfig, file);

            expect(result).to.be.equal(false);
        });
    });

    describe('update', () => {
        it('should update the compiler eraVersion if it exists in the userConfigCompilers', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const compiler: SolcConfig = {
                version: '0.8.17',
                settings: {},
            };
            const userConfigCompilers = [{ version: '0.8.17', eraVersion: '0.0.1' }, { version: '0.7.0' }];
            const file = undefined;
            const zksolc: ZkSolcConfig = { version: '1.5.0', settings: {} };

            updater.update(compiler, zksolc, userConfigCompilers, file);

            expect(compiler.eraVersion).to.equal('0.0.1');
        });

        it('should throw an error if there are multiple compilerInfos with different eraVersions', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const compiler: SolcConfig = { version: '0.8.17', settings: {} };
            const userConfigCompilers = [{ version: '0.8.17', eraVersion: '0.0.1' }, { version: '0.8.17' }];
            const file = undefined;
            const zksolc: ZkSolcConfig = { version: '1.5.0', settings: {} };
            try {
                updater.update(compiler, zksolc, userConfigCompilers, file);
                expect.fail('Expected an error to be thrown');
            } catch (error: any) {
                expect(error.message).to.equal(
                    'Your Hardhat configuration has conflicting Solidity compiler versions for version 0.8.17. Specify either a compiler version with zkVm support (eraVersion) or one without it.',
                );
            }
        });

        it('should not update the compiler eraVersion if it does not exist in the userConfigCompilers', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const compiler: SolcConfig = { version: '0.8.17', settings: {} };
            const userConfigCompilers = [{ version: '0.7.0' }, { version: '0.6.0' }];
            const file = undefined;
            const zksolc: ZkSolcConfig = { version: '1.5.0', settings: {} };

            updater.update(compiler, zksolc, userConfigCompilers, file);

            expect(compiler.eraVersion).to.be.equal(undefined);
        });

        it('should update the compiler eraVersion if zksolc version is < 1.5.0 and evmla codegen is in the use', () => {
            const updater = new CompilerSolcUserConfigUpdater();
            const compiler: SolcConfig = { version: '0.8.17', settings: { viaEVMAssembly: true } };
            const userConfigCompilers = [{ version: '0.8.17' }, { version: '0.6.0' }];
            const file = undefined;
            const zksolc: ZkSolcConfig = { version: 'latest', settings: { viaYul: true } };

            updater.update(compiler, zksolc, userConfigCompilers, file);

            expect(compiler.eraVersion).to.be.equal('1.0.0');
        });
    });
});
