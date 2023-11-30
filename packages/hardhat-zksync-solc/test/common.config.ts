import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.3.17',
        compilerSource: 'binary',
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    solidity: {
        version: process.env.SOLC_VERSION || '0.8.17'
    },
};

export default config;
