import '@matterlabs/hardhat-zksync-deploy';
import '@matterlabs/hardhat-zksync-solc';

import { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
    zksolc: {
        compilerSource: 'binary',
        settings: {
            isSystem: true,
            optimizer: {
                enabled: true,
            },
        }
    },
    networks: {
        hardhat: {
            zksync: true,
        },
    },
    // Docker image only works for solidity ^0.8.0.
    // For earlier versions you need to use binary releases of zksolc.
    // solidity: {
    //     version: "0.8.17",
    //     eraVersion: "0.8.17",
    //     settings: {
    //         optimizer: {
    //             enabled: true,
    //         },

    //     },
    // }
    solidity: {
        overrides: {
            "contracts/001_deploy/Greeter.sol": {
                version: "0.8.16",
            },
            "contracts/002_factory/Foo.sol": {
                version: "0.8.16",
                eraVersion: "latest"
            }
        },
        compilers: [
            {
                version: "0.8.17",
                eraVersion: "latest",
                settings: {
                    optimizer: {
                        enabled: true,
                    },
                },
            }
        ]
    }
};

export default config;
