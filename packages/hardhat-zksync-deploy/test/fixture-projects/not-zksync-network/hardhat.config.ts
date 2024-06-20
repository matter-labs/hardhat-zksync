import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/types';

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            zksync: false,
        },
    },
};

export default config;
