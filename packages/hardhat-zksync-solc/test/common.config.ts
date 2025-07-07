import * as semver from 'semver';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        compilerSource: 'binary',
        settings: {
            forceEVMLA: semver.lt(process.env.SOLC_VERSION || '0.8.17', '0.8.0'),
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
