import '@matterlabs/hardhat-zksync-solc';
import '@matterlabs/hardhat-zksync-node';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        version: '1.5.15',
        settings: {
            enableEraVMExtensions: true,
            optimizer: {
                enabled: true,
            },
            codegen: "yul",
        }
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
