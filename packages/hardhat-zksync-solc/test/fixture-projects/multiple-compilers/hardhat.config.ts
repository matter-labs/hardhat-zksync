import '../../../src/index';
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
        compilers: [
            {
                version: '0.8.17',
            },
        ],
        overrides: {
            'contracts/Greeter2.sol': {
                version: '0.8.16',
            },
        },
    },
};

export default config;
