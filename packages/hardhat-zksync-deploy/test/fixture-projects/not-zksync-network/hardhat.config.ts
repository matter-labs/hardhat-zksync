import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        version: '1.5.15',
        settings: {},
    },
    networks: {
        hardhat: {
            zksync: false,
        },
    },
};

export default config;
