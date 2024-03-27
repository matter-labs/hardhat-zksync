import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    zksolc: {
        settings: {},
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
};

export default config;
