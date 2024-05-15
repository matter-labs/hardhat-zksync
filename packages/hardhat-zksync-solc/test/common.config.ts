import * as semver from 'semver';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            viaYul: semver.gte(process.env.SOLC_VERSION || '0.8.17', '0.8.0'),
            viaEVMAssembly: semver.lt(process.env.SOLC_VERSION || '0.8.17', '0.8.0'),
        },
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    solidity: {
        version: process.env.SOLC_VERSION || '0.8.17',
    },
};

export default config;
