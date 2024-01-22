import { expect } from 'chai';
import {
    SolcMultiUserConfigExtractor,
    SolcSoloUserConfigExtractor,
    SolcStringUserConfigExtractor,
} from '../../src/config-extractor';

describe('SolcMultiUserConfigExtractor', () => {
    describe('suitable', () => {
        it('should return false if solidityConfig is undefined', () => {
            const extractor = new SolcMultiUserConfigExtractor();
            const result = extractor.suitable(undefined);
            expect(result).to.be.equal(false);
        });

        it('should return true if solidityConfig is a MultiSolcUserConfig', () => {
            const solidityConfig = {
                compilers: [],
                overrides: {},
            };
            const extractor = new SolcMultiUserConfigExtractor();
            const result = extractor.suitable(solidityConfig);
            expect(result).to.be.equal(true);
        });
    });

    describe('extract', () => {
        it('should extract the solc user config data', () => {
            const solidityConfig = {
                compilers: [],
                overrides: {
                    'file1.sol': {
                        version: '0.8.17',
                        settings: {
                            optimizer: {
                                enabled: true,
                                runs: 200,
                            },
                            outputSelection: {},
                            metadata: {},
                        },
                    },
                    'file2.sol': {
                        version: '0.7.3',
                        settings: {
                            optimizer: {
                                enabled: false,
                                runs: 150,
                            },
                            outputSelection: {},
                            metadata: {},
                        },
                    },
                },
            };
            const extractor = new SolcMultiUserConfigExtractor();
            const result = extractor.extract(solidityConfig);

            expect(result.compilers).to.deep.equal([]);
            expect(result.overides).to.deep.equal(
                new Map([
                    [
                        'file1.sol',
                        {
                            version: '0.8.17',
                            settings: {
                                optimizer: {
                                    enabled: true,
                                    runs: 200,
                                },
                                outputSelection: {},
                                metadata: {},
                            },
                        },
                    ],
                    [
                        'file2.sol',
                        {
                            version: '0.7.3',
                            settings: {
                                optimizer: {
                                    enabled: false,
                                    runs: 150,
                                },
                                outputSelection: {},
                                metadata: {},
                            },
                        },
                    ],
                ]),
            );
        });
    });
});

describe('SolcSoloUserConfigExtractor', () => {
    describe('suitable', () => {
        it('should return false if solidityConfig is undefined', () => {
            const solidityConfig = undefined;
            const extractor = new SolcSoloUserConfigExtractor();

            const result = extractor.suitable(solidityConfig);

            expect(result).to.be.equal(false);
        });

        it('should return true if solidityConfig is a SolcUserConfig', () => {
            const solidityConfig = {
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
            };
            const extractor = new SolcSoloUserConfigExtractor();

            const result = extractor.suitable(solidityConfig);

            expect(result).to.be.equal(true);
        });
    });

    describe('extract', () => {
        it('should extract the solc user config data', () => {
            const solidityConfig = {
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
            };
            const extractor = new SolcSoloUserConfigExtractor();

            const result = extractor.extract(solidityConfig);

            expect(result.compilers).to.deep.equal([solidityConfig]);
        });
    });
});

describe('SolcStringUserConfigExtractor', () => {
    describe('suitable', () => {
        it('should return false if solidityConfig is undefined', () => {
            const solidityConfig = undefined;
            const extractor = new SolcStringUserConfigExtractor();

            const result = extractor.suitable(solidityConfig);

            expect(result).to.be.equal(false);
        });

        it('should return true if solidityConfig is a string', () => {
            const solidityConfig = 'solc-config';
            const extractor = new SolcStringUserConfigExtractor();

            const result = extractor.suitable(solidityConfig);

            expect(result).to.be.equal(true);
        });
    });

    describe('extract', () => {
        it('should extract the solc user config data', () => {
            const solidityConfig = 'solc-config';
            const extractor = new SolcStringUserConfigExtractor();

            const result = extractor.extract(solidityConfig);

            expect(result.compilers).to.deep.equal([]);
        });
    });
});
