import '../../../src/index';
import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'docker',
        settings: {
            viaEVMAssembly: true,
            experimental: {
                dockerImage: 'matterlabs/zksolc',
                tag: 'latest',
            },
        },
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    solidity: {
        version: '0.8.17',
    },
};

export default config;
