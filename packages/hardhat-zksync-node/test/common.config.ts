import '../../hardhat-zksync-solc/src/index';
import '../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
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
